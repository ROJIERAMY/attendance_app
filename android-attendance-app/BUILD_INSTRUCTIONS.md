# تعليمات بناء APK لنظام الحضور والغياب

## المتطلبات الأساسية:

1. **Java JDK 8 أو أحدث** - يجب تثبيته وإضافة JAVA_HOME إلى متغيرات البيئة
2. **Android SDK** - يجب تثبيت Android SDK و Android Build Tools
3. **Gradle** - سيتم تحميله تلقائياً عند البناء

## طريقة البناء:

### الطريقة 1: استخدام Android Studio (موصى بها)

1. افتح Android Studio
2. اختر "Open an existing project"
3. اختر مجلد `android-attendance-app`
4. انتظر حتى يتم تحميل المشروع
5. من القائمة: Build → Build Bundle(s) / APK(s) → Build APK(s)
6. بعد اكتمال البناء، اضغط على "locate" لفتح مجلد APK
7. الملف سيكون في: `app/build/outputs/apk/release/app-release.apk`

### الطريقة 2: استخدام سطر الأوامر

1. افتح Command Prompt أو PowerShell في مجلد `android-attendance-app`
2. قم بتشغيل:
   ```bash
   gradlew.bat assembleRelease
   ```
3. بعد اكتمال البناء، سيكون APK في: `app/build/outputs/apk/release/app-release.apk`

### الطريقة 3: استخدام ملف build-apk.bat

1. انقر نقراً مزدوجاً على `build-apk.bat`
2. انتظر حتى يكتمل البناء
3. سيكون APK في: `app/build/outputs/apk/release/app-release.apk`

## تثبيت APK على الجهاز اللوحي:

1. انقل ملف `app-release.apk` إلى الجهاز اللوحي
2. على الجهاز اللوحي، اذهب إلى Settings → Security
3. فعّل "Unknown sources" أو "Install from unknown sources"
4. افتح ملف APK واتبع التعليمات للتثبيت

## ملاحظات:

- التطبيق يعمل offline بالكامل
- جميع الوظائف متوفرة: الحضور والغياب، تعديل الدرجات، البحث، إلخ
- التطبيق يدعم اللغة العربية و RTL
- حجم APK تقريبي: 5-10 MB

## استكشاف الأخطاء:

إذا واجهت مشاكل في البناء:
1. تأكد من تثبيت Java JDK وإضافة JAVA_HOME
2. تأكد من تثبيت Android SDK
3. تأكد من وجود اتصال بالإنترنت لتحميل Gradle dependencies
4. جرب تنظيف المشروع: `gradlew.bat clean` ثم `gradlew.bat assembleRelease`


