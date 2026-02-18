# نظام الحضور والغياب - تطبيق Android

تطبيق Android للعمل على الأجهزة اللوحية (Tablets) بنفس وظائف النسخة الويب.

## الميزات:

✅ يعمل offline بالكامل  
✅ جميع الوظائف متوفرة:
- قراءة ملفات Excel
- تسجيل الحضور والغياب
- تعديل الدرجات (عدد مرات الحضور، درجة الحضور، درجة الامتحان، درجة القبلي، درجة الطقس، المجموع)
- زيادة عدد مرات الحضور تلقائياً عند الحضور
- زيادة درجة الحضور بمقدار 5 تلقائياً عند الحضور
- البحث بالاسم
- الترتيب الأبجدي
- السحب والإفلات للحضور
- حفظ التعديلات في Excel

## متطلبات البناء:

1. **Java JDK 8+** - يجب تثبيته
2. **Android Studio** (موصى به) أو Android SDK
3. **Gradle** - سيتم تحميله تلقائياً

## طريقة البناء:

### باستخدام Android Studio (أسهل طريقة):

1. افتح Android Studio
2. File → Open → اختر مجلد `android-attendance-app`
3. انتظر حتى يتم تحميل المشروع
4. Build → Build Bundle(s) / APK(s) → Build APK(s)
5. بعد اكتمال البناء، اضغط على "locate" في الإشعار
6. APK سيكون في: `app/build/outputs/apk/release/app-release.apk`

### باستخدام سطر الأوامر:

```bash
cd android-attendance-app
gradlew.bat assembleRelease
```

APK سيكون في: `app/build/outputs/apk/release/app-release.apk`

## تثبيت على الجهاز اللوحي:

1. انقل ملف `app-release.apk` إلى الجهاز اللوحي
2. على الجهاز: Settings → Security → فعّل "Install from unknown sources"
3. افتح ملف APK واتبع التعليمات

## معلومات التطبيق:

- **اسم التطبيق**: نظام الحضور والغياب
- **الإصدار**: 1.1 (versionCode: 2)
- **الحجم التقريبي**: 5-10 MB
- **الحد الأدنى للإصدار**: Android 5.0 (API 21)
- **الهدف**: Android 14 (API 34)

## ملاحظات:

- التطبيق يعمل offline بالكامل
- يدعم اللغة العربية و RTL
- محسّن للعمل على الأجهزة اللوحية
- جميع الملفات محفوظة محلياً في التطبيق

## استكشاف الأخطاء:

إذا فشل البناء:
1. تأكد من تثبيت Java JDK وإضافة JAVA_HOME
2. تأكد من تثبيت Android SDK
3. جرب: `gradlew.bat clean` ثم `gradlew.bat assembleRelease`


