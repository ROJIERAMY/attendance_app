# دليل تثبيت التطبيق على الجهاز اللوحي (Tablet)

## المشكلة الشائعة: APK لا يتم تثبيته

إذا كان APK لا يتم تثبيته على الجهاز اللوحي، اتبع الخطوات التالية:

## الطريقة 1: تفعيل تثبيت من مصادر غير معروفة

### على Android 8.0 (Oreo) وأحدث:

1. افتح **Settings** (الإعدادات)
2. اذهب إلى **Apps** أو **Applications**
3. ابحث عن **Files** أو **File Manager** أو **Downloads**
4. اضغط على التطبيق
5. فعّل **Install unknown apps** أو **Install apps from this source**
6. الآن حاول تثبيت APK مرة أخرى

### على Android 7.0 وأقدم:

1. افتح **Settings** (الإعدادات)
2. اذهب إلى **Security** (الأمان)
3. فعّل **Unknown sources** (مصادر غير معروفة)
4. اضغط **OK** للتأكيد
5. الآن حاول تثبيت APK

## الطريقة 2: نقل الملف عبر USB

1. وصّل الجهاز اللوحي بالكمبيوتر عبر USB
2. على الجهاز اللوحي، فعّل **USB debugging** من Developer Options
3. انقل ملف `attendance-system.apk` إلى مجلد **Download** على الجهاز
4. على الجهاز اللوحي، افتح **Files** أو **File Manager**
5. اذهب إلى مجلد **Download**
6. اضغط على `attendance-system.apk`
7. اضغط **Install**

## الطريقة 3: استخدام Google Drive أو Dropbox

1. ارفع ملف `attendance-system.apk` إلى Google Drive أو Dropbox
2. على الجهاز اللوحي، افتح التطبيق (Google Drive أو Dropbox)
3. حمّل الملف
4. اضغط على الملف بعد التحميل
5. اضغط **Install**

## الطريقة 4: استخدام ADB (للمستخدمين المتقدمين)

1. فعّل **USB debugging** على الجهاز اللوحي:
   - Settings → About tablet → اضغط 7 مرات على Build number
   - Settings → Developer options → فعّل USB debugging

2. وصّل الجهاز بالكمبيوتر عبر USB

3. على الكمبيوتر، شغّل:
   ```bash
   adb install attendance-system.apk
   ```

## الطريقة 5: استخدام تطبيق File Manager

1. حمّل تطبيق **File Manager** من Google Play (مثل ES File Explorer أو Solid Explorer)
2. انقل APK إلى الجهاز اللوحي
3. افتح File Manager
4. اذهب إلى مجلد APK
5. اضغط على الملف واختر **Install**

## حل المشاكل الشائعة:

### المشكلة: "App not installed" أو "Installation failed"

**الحل:**
- تأكد من تفعيل "Install from unknown sources"
- تأكد من أن الجهاز يدعم Android 5.0 (API 21) أو أحدث
- جرب حذف أي إصدار سابق من التطبيق أولاً

### المشكلة: "Package appears to be corrupt"

**الحل:**
- حمّل APK مرة أخرى (قد يكون التحميل ناقصاً)
- تأكد من أن حجم الملف 5.12 MB

### المشكلة: "App not compatible with your device"

**الحل:**
- تأكد من أن الجهاز يدعم Android 5.0 (Lollipop) أو أحدث
- تحقق من إصدار Android: Settings → About tablet → Android version

### المشكلة: لا يظهر زر Install

**الحل:**
- تأكد من تفعيل "Install from unknown sources" للتطبيق المستخدم (Files, Chrome, إلخ)
- جرب استخدام تطبيق File Manager مختلف

## معلومات التطبيق:

- **الحد الأدنى**: Android 5.0 (API 21)
- **الحجم**: ~5.12 MB
- **الاسم**: نظام الحضور والغياب
- **Package**: com.example.attendance

## ملاحظات مهمة:

1. **لا حاجة للإنترنت**: التطبيق يعمل offline بالكامل
2. **الصلاحيات**: التطبيق يحتاج صلاحيات قراءة/كتابة الملفات لفتح وحفظ Excel
3. **الأمان**: APK موقّع بـ debug key - آمن للاستخدام الشخصي

## إذا استمرت المشكلة:

1. تأكد من أن APK كامل (5.12 MB)
2. جرب تثبيت APK على جهاز لوحي آخر للتحقق
3. تأكد من أن الجهاز اللوحي ليس في وضع "Restricted profile"
4. جرب إعادة تشغيل الجهاز اللوحي

---

**نصيحة**: أسهل طريقة هي استخدام USB لنقل الملف ثم تثبيته من File Manager على الجهاز.


