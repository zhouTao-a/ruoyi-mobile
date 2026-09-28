package uts.sdk.modules.hanhanRemind

import android.app.AlarmManager
import android.app.Activity
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.media.AudioAttributes
import android.media.Ringtone
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.PowerManager
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.provider.Settings
import android.util.Log
import android.util.TypedValue
import android.view.Gravity
import android.view.WindowManager
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import io.dcloud.uts.UTSAndroid
import org.json.JSONArray
import java.util.Calendar
import org.json.JSONObject

/**
 * 手机本地闹钟与桌面角标。
 * 闹钟走 setAlarmClock，进程被划掉、锁屏后仍会打开响铃页。
 */
object RemindNative {
    private const val TAG = "HanhanRemind"
    private const val PREF = "hanhan_remind"
    private const val KEY_ALARMS = "alarms"
    private const val CHANNEL_ALARM = "hanhan_alarm_ring"
    private const val CHANNEL_ALARM_OLD = "hanhan_alarm"
    private const val CHANNEL_TODAY = "hanhan_today"
    const val CHANNEL_GUARD = "hanhan_guard"
    private const val TODAY_NOTIFY_ID = 0x48414e01
    const val GUARD_NOTIFY_ID = 0x48414e02
    private const val SNOOZE_MS = 10 * 60 * 1000L

    const val EXTRA_ID = "remind_id"
    const val EXTRA_TITLE = "remind_title"

    @JvmStatic
    fun sync(payload: String) {
        val context = appContext() ?: return
        ensureChannels(context)
        val incoming = try {
            JSONArray(if (payload.isBlank()) "[]" else payload)
        } catch (e: Exception) {
            JSONArray()
        }
        // 打开 App 时服务器上的这次已过点，不能把「10分钟后再响」清掉
        val merged = mergeSnooze(context, incoming)
        cancelStored(context)
        writeAlarms(context, merged)
        scheduleStored(context)
        refreshRemaining(context)
        startGuard(context)
    }

    @JvmStatic
    fun setTodayCount(count: Int) {
        val context = appContext() ?: return
        publishCount(context, count)
    }

    /** 角标只保留「现在到今晚 24:00」仍会响的条数。到点、停止、稍后提醒后立刻重算。 */
    fun refreshRemaining(context: Context) {
        publishCount(context, remainingUntilMidnight(context))
    }

    private fun publishCount(context: Context, count: Int) {
        ensureChannels(context)
        val safe = if (count < 0) 0 else count
        pushBadge(context, safe)
        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (safe == 0) {
            nm.cancel(TODAY_NOTIFY_ID)
            return
        }
        // 不发声。部分桌面靠这条通知的数字在图标上显示角标，用户可以划掉。
        // 点击打开应用首页，点开后自动消失。
        val builder = notificationBuilder(context, CHANNEL_TODAY)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle("今日${safe}件事件")
            .setContentText("打开涵涵通知查看")
            .setAutoCancel(true)
            .setOnlyAlertOnce(true)
        openAppPending(context)?.let { builder.setContentIntent(it) }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            builder.setNumber(safe)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            builder.setVisibility(Notification.VISIBILITY_PUBLIC)
        }
        nm.notify(TODAY_NOTIFY_ID, builder.build())
    }

    /** 已保存闹钟里，响铃时间落在现在到今晚 24:00 之间的条数。 */
    private fun remainingUntilMidnight(context: Context): Int {
        val now = System.currentTimeMillis()
        val end = Calendar.getInstance()
        end.timeInMillis = now
        end.add(Calendar.DAY_OF_MONTH, 1)
        end.set(Calendar.HOUR_OF_DAY, 0)
        end.set(Calendar.MINUTE, 0)
        end.set(Calendar.SECOND, 0)
        end.set(Calendar.MILLISECOND, 0)
        val endMs = end.timeInMillis
        val array = readAlarms(context)
        var count = 0
        for (i in 0 until array.length()) {
            val at = array.optJSONObject(i)?.optLong("at") ?: continue
            if (at > now && at < endMs) count += 1
        }
        return count
    }

    @JvmStatic
    fun clear() {
        val context = appContext() ?: return
        cancelStored(context)
        prefs(context).edit().remove(KEY_ALARMS).apply()
        setTodayCount(0)
        silence()
        stopGuard(context)
    }

    /** 开机后没有页面环境，用 Application 上下文重登上次的闹钟。 */
    @JvmStatic
    fun reschedule(context: Context) {
        ensureChannels(context)
        scheduleStored(context)
        refreshRemaining(context)
        startGuard(context)
    }

    @JvmStatic
    fun snooze(context: Context, id: String, title: String) {
        val at = System.currentTimeMillis() + SNOOZE_MS
        upsert(context, id, title, at)
        scheduleOne(context, id, title, at)
        cancelNotify(context, id)
        silence()
        refreshRemaining(context)
    }

    @JvmStatic
    fun dismiss(context: Context, id: String) {
        remove(context, id)
        cancelAlarm(context, id)
        cancelNotify(context, id)
        silence()
        refreshRemaining(context)
    }

    private fun appContext(): Context? {
        return try {
            UTSAndroid.getAppContext()
        } catch (e: Exception) {
            Log.w(TAG, "no app context", e)
            null
        }
    }

    private fun prefs(context: Context) = context.getSharedPreferences(PREF, Context.MODE_PRIVATE)

    private fun ensureChannels(context: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (nm.getNotificationChannel(CHANNEL_ALARM_OLD) != null) {
            nm.deleteNotificationChannel(CHANNEL_ALARM_OLD)
        }
        if (nm.getNotificationChannel(CHANNEL_ALARM) == null) {
            val alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
                ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
            val alarm = NotificationChannel(CHANNEL_ALARM, "事件闹钟", NotificationManager.IMPORTANCE_HIGH)
            alarm.description = "事件到点提醒"
            val attrs = AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ALARM)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build()
            alarm.setSound(alarmUri, attrs)
            alarm.enableVibration(true)
            alarm.vibrationPattern = longArrayOf(0, 800, 400, 800, 400)
            alarm.lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            nm.createNotificationChannel(alarm)
        }
        if (nm.getNotificationChannel(CHANNEL_TODAY) == null) {
            val today = NotificationChannel(CHANNEL_TODAY, "今日事件", NotificationManager.IMPORTANCE_LOW)
            today.description = "图标上的今日事件数量"
            today.setSound(null, null)
            today.enableVibration(false)
            today.setShowBadge(true)
            nm.createNotificationChannel(today)
        }
        if (nm.getNotificationChannel(CHANNEL_GUARD) == null) {
            val guard = NotificationChannel(CHANNEL_GUARD, "闹钟守护", NotificationManager.IMPORTANCE_MIN)
            guard.description = "保持应用在后台运行，确保锁屏后闹钟能准时响起"
            guard.setSound(null, null)
            guard.enableVibration(false)
            guard.setShowBadge(false)
            nm.createNotificationChannel(guard)
        }
    }

    /** 启动前台服务保持进程，避免锁屏后被系统冻结导致到点不响。 */
    fun startGuard(context: Context) {
        ensureChannels(context)
        try {
            val intent = Intent(context, GuardService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        } catch (e: Exception) {
            Log.w(TAG, "start guard failed", e)
        }
    }

    fun stopGuard(context: Context) {
        try {
            context.stopService(Intent(context, GuardService::class.java))
        } catch (e: Exception) {
            Log.d(TAG, "stop guard skip")
        }
    }

    /** 今日事件通知的点击目标：回到应用启动页。 */
    private fun openAppPending(context: Context): PendingIntent? {
        val launch = context.packageManager.getLaunchIntentForPackage(context.packageName) ?: return null
        launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
        val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        } else {
            PendingIntent.FLAG_UPDATE_CURRENT
        }
        return PendingIntent.getActivity(context, TODAY_NOTIFY_ID, launch, flags)
    }

    private fun notificationBuilder(context: Context, channelId: String): Notification.Builder {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(context, channelId)
        } else {
            @Suppress("DEPRECATION")
            Notification.Builder(context)
        }
    }

    private fun mergeSnooze(context: Context, incoming: JSONArray): JSONArray {
        val ids = HashSet<String>()
        for (i in 0 until incoming.length()) {
            ids.add(incoming.optJSONObject(i)?.optString("id") ?: "")
        }
        val now = System.currentTimeMillis()
        val merged = JSONArray(incoming.toString())
        val old = readAlarms(context)
        for (i in 0 until old.length()) {
            val item = old.optJSONObject(i) ?: continue
            val id = item.optString("id")
            val at = item.optLong("at")
            if (id.isNotBlank() && id !in ids && at > now && at - now <= SNOOZE_MS + 60_000) {
                merged.put(item)
            }
        }
        return merged
    }

    private fun readAlarms(context: Context): JSONArray {
        val raw = prefs(context).getString(KEY_ALARMS, "[]") ?: "[]"
        return try {
            JSONArray(raw)
        } catch (e: Exception) {
            JSONArray()
        }
    }

    private fun writeAlarms(context: Context, array: JSONArray) {
        prefs(context).edit().putString(KEY_ALARMS, array.toString()).apply()
    }

    private fun scheduleStored(context: Context) {
        val array = readAlarms(context)
        val now = System.currentTimeMillis()
        for (i in 0 until array.length()) {
            val item = array.optJSONObject(i) ?: continue
            val at = item.optLong("at")
            if (at <= now) continue
            scheduleOne(context, item.optString("id"), item.optString("title", "事件提醒"), at)
        }
    }

    private fun cancelStored(context: Context) {
        val array = readAlarms(context)
        for (i in 0 until array.length()) {
            val item = array.optJSONObject(i) ?: continue
            cancelAlarm(context, item.optString("id"))
        }
    }

    private fun scheduleOne(context: Context, id: String, title: String, at: Long) {
        if (id.isBlank() || at <= System.currentTimeMillis()) return
        val am = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        // 到点走广播，避免系统拦掉直接打开的页面后连通知都没有。
        // 状态栏闹钟图标单独打开首页，不能和到点动作共用同一个意图。
        val fire = alarmFirePending(context, id, title)
        val show = openAppPending(context) ?: alarmOpenPending(context, id, title)
        try {
            am.setAlarmClock(AlarmManager.AlarmClockInfo(at, show), fire)
        } catch (e: Exception) {
            Log.w(TAG, "setAlarmClock failed", e)
            promptExactAlarmOnce(context)
        }
    }

    private fun cancelAlarm(context: Context, id: String) {
        if (id.isBlank()) return
        val am = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        am.cancel(alarmFirePending(context, id, ""))
        am.cancel(legacyAlarmPending(context, id))
    }

    /** 到点先发通知并响铃，再尝试打开响铃页。页面被系统拦住时，通知本身仍会响。 */
    @JvmStatic
    fun onAlarmFired(context: Context, id: String, title: String) {
        val shown = if (title.isBlank()) "事件提醒" else title
        showAlarmNotification(context, id, shown)
        AlarmActivity.beginRing(context)
        holdRingLock(context)
        armRingTimeout()
        try {
            context.startActivity(alarmOpenIntent(context, id, shown))
        } catch (e: Exception) {
            Log.w(TAG, "open alarm page failed", e)
        }
    }

    @JvmStatic
    fun silence() {
        ringTimeout?.let { mainHandler.removeCallbacks(it) }
        AlarmActivity.stopRing()
        releaseRingLock()
    }

    private val mainHandler by lazy { Handler(Looper.getMainLooper()) }
    private var ringTimeout: Runnable? = null
    private var ringLock: PowerManager.WakeLock? = null
    private var exactPrompted = false

    private fun armRingTimeout() {
        ringTimeout?.let { mainHandler.removeCallbacks(it) }
        val task = Runnable { silence() }
        ringTimeout = task
        mainHandler.postDelayed(task, 60_000)
    }

    private fun holdRingLock(context: Context) {
        try {
            if (ringLock?.isHeld == true) return
            val pm = context.getSystemService(Context.POWER_SERVICE) as PowerManager
            @Suppress("DEPRECATION")
            val lock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "hanhan:alarm")
            lock.acquire(60_000)
            ringLock = lock
        } catch (e: Exception) {
            Log.d(TAG, "wake lock skip")
        }
    }

    private fun releaseRingLock() {
        try {
            if (ringLock?.isHeld == true) ringLock?.release()
        } catch (e: Exception) {
            Log.d(TAG, "wake lock release")
        }
        ringLock = null
    }

    /** 精确闹钟被关掉时，前台同步失败才跳设置，避免开机广播里反复弹。 */
    private fun promptExactAlarmOnce(context: Context) {
        if (exactPrompted || Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return
        val am = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        if (am.canScheduleExactAlarms()) return
        if (prefs(context).getBoolean("exact_asked", false)) return
        exactPrompted = true
        try {
            val intent = Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM)
            intent.data = Uri.parse("package:" + context.packageName)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(intent)
            prefs(context).edit().putBoolean("exact_asked", true).apply()
        } catch (e: Exception) {
            Log.w(TAG, "exact alarm settings", e)
        }
    }

    private fun pendingFlags(): Int {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        } else {
            PendingIntent.FLAG_UPDATE_CURRENT
        }
    }

    private fun alarmFirePending(context: Context, id: String, title: String): PendingIntent {
        val intent = Intent(context, AlarmReceiver::class.java)
        intent.action = "com.hanhan.remind.FIRE.$id"
        intent.putExtra(EXTRA_ID, id)
        intent.putExtra(EXTRA_TITLE, title)
        return PendingIntent.getBroadcast(context, requestCode(id), intent, pendingFlags())
    }

    private fun alarmOpenIntent(context: Context, id: String, title: String): Intent {
        val intent = Intent(context, AlarmActivity::class.java)
        intent.action = "com.hanhan.remind.RING.$id"
        intent.putExtra(EXTRA_ID, id)
        intent.putExtra(EXTRA_TITLE, title)
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        return intent
    }

    private fun alarmOpenPending(context: Context, id: String, title: String): PendingIntent {
        return PendingIntent.getActivity(context, requestCode("open:$id"), alarmOpenIntent(context, id, title), pendingFlags())
    }

    /** 上一版到点直接打开页面，升级后要把那批登记取消掉。 */
    private fun legacyAlarmPending(context: Context, id: String): PendingIntent {
        val intent = Intent(context, AlarmActivity::class.java)
        intent.action = "com.hanhan.remind.ALARM.$id"
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        return PendingIntent.getActivity(context, requestCode(id), intent, pendingFlags())
    }

    private fun alarmStopPending(context: Context, id: String): PendingIntent {
        val intent = Intent(context, AlarmReceiver::class.java)
        intent.action = "com.hanhan.remind.STOP.$id"
        intent.putExtra(EXTRA_ID, id)
        return PendingIntent.getBroadcast(context, requestCode("stop:$id"), intent, pendingFlags())
    }

    fun showAlarmNotification(context: Context, id: String, title: String) {
        ensureChannels(context)
        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val shown = if (title.isBlank()) "事件提醒" else title
        val open = alarmOpenPending(context, id, shown)
        val builder = notificationBuilder(context, CHANNEL_ALARM)
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setContentTitle(shown)
            .setContentText("事件提醒")
            .setContentIntent(open)
            .setFullScreenIntent(open, true)
            .setDeleteIntent(alarmStopPending(context, id))
            .setAutoCancel(true)
            .setCategory(Notification.CATEGORY_ALARM)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            builder.setVisibility(Notification.VISIBILITY_PUBLIC)
        }
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            val alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
                ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
            @Suppress("DEPRECATION")
            builder.setPriority(Notification.PRIORITY_MAX)
            builder.setSound(alarmUri)
        }
        try {
            nm.notify(requestCode(id), builder.build())
        } catch (e: SecurityException) {
            Log.w(TAG, "notify denied", e)
        }
    }

    private fun cancelNotify(context: Context, id: String) {
        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        nm.cancel(requestCode(id))
    }

    private fun upsert(context: Context, id: String, title: String, at: Long) {
        val array = readAlarms(context)
        val next = JSONArray()
        for (i in 0 until array.length()) {
            val item = array.optJSONObject(i) ?: continue
            if (item.optString("id") != id) next.put(item)
        }
        val row = JSONObject()
        row.put("id", id)
        row.put("title", title)
        row.put("at", at)
        next.put(row)
        writeAlarms(context, next)
    }

    private fun remove(context: Context, id: String) {
        val array = readAlarms(context)
        val next = JSONArray()
        for (i in 0 until array.length()) {
            val item = array.optJSONObject(i) ?: continue
            if (item.optString("id") != id) next.put(item)
        }
        writeAlarms(context, next)
    }

    private fun requestCode(id: String): Int = id.hashCode() and 0x7fffffff

    /** 各品牌桌面角标接口不统一，能设则设，失败就靠通知数字。 */
    private fun pushBadge(context: Context, count: Int) {
        val launch = context.packageManager.getLaunchIntentForPackage(context.packageName)
        val cls = launch?.component?.className ?: return
        val pkg = context.packageName
        tryHuawei(context, pkg, cls, count)
        tryHonor(context, pkg, cls, count)
        tryXiaomi(context, pkg, cls, count)
        tryOppo(context, pkg, count)
        tryVivo(context, pkg, cls, count)
        trySamsung(context, pkg, cls, count)
    }

    private fun tryHuawei(context: Context, pkg: String, cls: String, count: Int) {
        badgeCall(context, "content://com.huawei.android.launcher.settings/badge/", pkg, cls, count)
    }

    private fun tryHonor(context: Context, pkg: String, cls: String, count: Int) {
        badgeCall(context, "content://com.hihonor.android.launcher.settings/badge/", pkg, cls, count)
    }

    private fun badgeCall(context: Context, uri: String, pkg: String, cls: String, count: Int) {
        try {
            val extra = Bundle()
            extra.putString("package", pkg)
            extra.putString("class", cls)
            extra.putInt("badgenumber", count)
            context.contentResolver.call(Uri.parse(uri), "change_badge", null, extra)
        } catch (e: Exception) {
            Log.d(TAG, "badge skip $uri")
        }
    }

    private fun tryXiaomi(context: Context, pkg: String, cls: String, count: Int) {
        try {
            val intent = Intent("android.intent.action.APPLICATION_MESSAGE_UPDATE")
            intent.putExtra("android.intent.extra.update_application_component_name", "$pkg/$cls")
            intent.putExtra(
                "android.intent.extra.update_application_message_text",
                if (count > 0) count.toString() else ""
            )
            context.sendBroadcast(intent)
        } catch (e: Exception) {
            Log.d(TAG, "xiaomi badge skip")
        }
    }

    private fun tryOppo(context: Context, pkg: String, count: Int) {
        try {
            val intent = Intent("com.oppo.unsettledevent")
            intent.putExtra("pakeageName", pkg)
            intent.putExtra("number", count)
            intent.putExtra("upgradeNumber", count)
            context.sendBroadcast(intent)
        } catch (e: Exception) {
            Log.d(TAG, "oppo badge skip")
        }
    }

    private fun tryVivo(context: Context, pkg: String, cls: String, count: Int) {
        try {
            val intent = Intent("launcher.action.CHANGE_APPLICATION_NOTIFICATION_NUM")
            intent.putExtra("packageName", pkg)
            intent.putExtra("className", cls)
            intent.putExtra("notificationNum", count)
            context.sendBroadcast(intent)
        } catch (e: Exception) {
            Log.d(TAG, "vivo badge skip")
        }
    }

    private fun trySamsung(context: Context, pkg: String, cls: String, count: Int) {
        try {
            val intent = Intent("android.intent.action.BADGE_COUNT_UPDATE")
            intent.putExtra("badge_count", count)
            intent.putExtra("badge_count_package_name", pkg)
            intent.putExtra("badge_count_class_name", cls)
            context.sendBroadcast(intent)
        } catch (e: Exception) {
            Log.d(TAG, "samsung badge skip")
        }
    }
}

/** 开机、覆盖安装后把已保存的下次响铃重新交给系统。 */
class RemindReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        val action = intent?.action ?: return
        if (action == Intent.ACTION_BOOT_COMPLETED || action == Intent.ACTION_MY_PACKAGE_REPLACED) {
            RemindNative.reschedule(context)
        }
    }
}

/**
 * 前台守护服务：保持应用进程不被冻结，锁屏后到点广播能稳定收到。
 * 常驻一条低优先级通知，退出登录或清空闹钟时停掉。
 */
class GuardService : Service() {
    override fun onCreate() {
        super.onCreate()
        val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(this, RemindNative.CHANNEL_GUARD)
        } else {
            @Suppress("DEPRECATION")
            Notification.Builder(this)
        }
        val notify = builder
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setContentTitle("闹钟守护中")
            .setContentText("确保锁屏后事件提醒准时响起")
            .setOngoing(true)
            .setPriority(Notification.PRIORITY_MIN)
            .build()
        startForeground(RemindNative.GUARD_NOTIFY_ID, notify)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        return START_STICKY
    }

    override fun onBind(intent: Intent?): android.os.IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
        val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        nm.cancel(RemindNative.GUARD_NOTIFY_ID)
    }
}

/** 到点由系统拉起。先响铃发通知，再打开响铃页。划掉通知则停止。 */
class AlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        val action = intent?.action ?: return
        if (action.startsWith("com.hanhan.remind.STOP.")) {
            RemindNative.silence()
            return
        }
        val id = intent.getStringExtra(RemindNative.EXTRA_ID) ?: return
        if (id.isBlank()) return
        val title = intent.getStringExtra(RemindNative.EXTRA_TITLE) ?: "事件提醒"
        RemindNative.onAlarmFired(context, id, title)
    }
}

/**
 * 到点全屏页：闹钟铃声加震动，最长 60 秒，可停止或 10 分钟后再响。
 */
class AlarmActivity : Activity() {
    private var wakeLock: PowerManager.WakeLock? = null
    private val handler = Handler(Looper.getMainLooper())
    private val stopTask = Runnable {
        RemindNative.silence()
        finish()
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        turnScreenOn()
        show(intent)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        show(intent)
    }

    override fun onDestroy() {
        handler.removeCallbacks(stopTask)
        releaseLock()
        super.onDestroy()
    }

    private fun show(intent: Intent?) {
        val id = intent?.getStringExtra(RemindNative.EXTRA_ID) ?: ""
        val title = intent?.getStringExtra(RemindNative.EXTRA_TITLE) ?: "事件提醒"
        RemindNative.showAlarmNotification(this, id, title)
        RemindNative.refreshRemaining(this)
        beginRing(this)
        acquireLock()
        handler.removeCallbacks(stopTask)
        handler.postDelayed(stopTask, 60_000)
        setContentView(buildPage(id, title))
    }

    private fun buildPage(id: String, title: String): LinearLayout {
        val root = LinearLayout(this)
        root.orientation = LinearLayout.VERTICAL
        root.gravity = Gravity.CENTER_HORIZONTAL
        root.setBackgroundColor(Color.WHITE)
        val pad = dp(28)
        root.setPadding(pad, dp(72), pad, pad)

        val name = TextView(this)
        name.text = if (title.isBlank()) "事件提醒" else title
        name.setTextColor(Color.parseColor("#1f2329"))
        name.setTextSize(TypedValue.COMPLEX_UNIT_SP, 28f)
        name.typeface = Typeface.DEFAULT_BOLD
        name.gravity = Gravity.CENTER
        root.addView(name, LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        ))

        val hint = TextView(this)
        hint.text = "事件提醒"
        hint.setTextColor(Color.parseColor("#8a8a8a"))
        hint.setTextSize(TypedValue.COMPLEX_UNIT_SP, 16f)
        hint.gravity = Gravity.CENTER
        val hintLp = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        )
        hintLp.topMargin = dp(12)
        hintLp.bottomMargin = dp(48)
        root.addView(hint, hintLp)

        val stop = Button(this)
        stop.text = "停止"
        stop.setOnClickListener {
            RemindNative.dismiss(this, id)
            finish()
        }
        root.addView(stop, buttonLayout())

        val snooze = Button(this)
        snooze.text = "10分钟后再响"
        snooze.setOnClickListener {
            RemindNative.snooze(this, id, title)
            finish()
        }
        val snoozeLp = buttonLayout()
        snoozeLp.topMargin = dp(16)
        root.addView(snooze, snoozeLp)
        return root
    }

    private fun buttonLayout(): LinearLayout.LayoutParams {
        val lp = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            dp(52)
        )
        return lp
    }

    private fun dp(value: Int): Int {
        return TypedValue.applyDimension(
            TypedValue.COMPLEX_UNIT_DIP,
            value.toFloat(),
            resources.displayMetrics
        ).toInt()
    }

    private fun turnScreenOn() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
        }
        @Suppress("DEPRECATION")
        window.addFlags(
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
                WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
        )
    }

    private fun acquireLock() {
        releaseLock()
        try {
            val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
            @Suppress("DEPRECATION")
            val lock = pm.newWakeLock(
                PowerManager.PARTIAL_WAKE_LOCK or PowerManager.ACQUIRE_CAUSES_WAKEUP,
                "hanhan:alarm"
            )
            lock.acquire(60_000)
            wakeLock = lock
        } catch (e: Exception) {
            Log.d("HanhanRemind", "wake lock skip")
        }
    }

    private fun releaseLock() {
        try {
            if (wakeLock?.isHeld == true) wakeLock?.release()
        } catch (e: Exception) {
            Log.d("HanhanRemind", "wake lock release")
        }
        wakeLock = null
    }

    companion object {
        fun beginRing(context: Context) {
            stopRing()
            val uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
                ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
            val tone = RingtoneManager.getRingtone(context, uri) ?: return
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                tone.audioAttributes = AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build()
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                tone.isLooping = true
            }
            ringtone = tone
            tone.play()
            vibrate(context)
        }

        private fun vibrate(context: Context) {
            val pattern = longArrayOf(0, 800, 400, 800, 400)
            try {
                val toneVibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    val manager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
                    manager.defaultVibrator
                } else {
                    @Suppress("DEPRECATION")
                    context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
                }
                vibrator = toneVibrator
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    toneVibrator.vibrate(VibrationEffect.createWaveform(pattern, 0))
                } else {
                    @Suppress("DEPRECATION")
                    toneVibrator.vibrate(pattern, 0)
                }
            } catch (e: Exception) {
                Log.d("HanhanRemind", "vibrate skip")
            }
        }

        private var ringtone: Ringtone? = null
        private var vibrator: Vibrator? = null

        fun stopRing() {
            try {
                ringtone?.stop()
            } catch (e: Exception) {
                Log.d("HanhanRemind", "stop ring")
            }
            ringtone = null
            try {
                vibrator?.cancel()
            } catch (e: Exception) {
                Log.d("HanhanRemind", "stop vibrate")
            }
            vibrator = null
        }
    }
}
