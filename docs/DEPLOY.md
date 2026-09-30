# خطوات النشر

```
Deploy setup · GitHub Pages · thmanyah fonts from a private repository
```

هذه الخطوات تنفذها أنت على حسابك في موقع GitHub عندما نقرر النشر، لأنها تتعلق بمستودعاتك ومفاتيحك. لا أحتاج أن أرى المفتاح، ولا تكتبه لي في المحادثة.

## ١. مستودع الموقع

أنشئ مستودعاً عاماً بهذا الاسم تماماً:

```
zahmee7.github.io
```

اتركه فارغاً، بدون ملف تعريف ولا ترخيص. أنا أرفع إليه المشروع عندما تطلب.

## ٢. مستودع الخط الخاص

أنشئ مستودعاً **خاصاً** بهذا الاسم:

```
thmanyah-fonts
```

وارفع إليه الملفات الثلاثة فقط، في أول المستودع وليس داخل مجلد:

```
thmanyahserifdisplay-Bold.woff2
thmanyahsans-Regular.woff2
thmanyahseriftext-Regular.woff2
```

تجدها على جهازك هنا:

```
src/assets/fonts/thmanyah/
```

## ٣. مفتاح القراءة

أنشئ مفتاحاً محدود الصلاحية من إعدادات حسابك:

```
Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token
```

واضبطه هكذا:

```
Repository access: Only select repositories → thmanyah-fonts
Permissions → Repository permissions → Contents: Read-only
Expiration: 1 year
```

انسخ المفتاح مرة واحدة، فالموقع لا يعرضه مرة ثانية.

## ٤. حفظ المفتاح في مستودع الموقع

في مستودع الموقع:

```
Settings → Secrets and variables → Actions → New repository secret
```

```
Name: FONTS_TOKEN
Secret: (المفتاح الذي نسخته)
```

## ٥. تفعيل النشر

في مستودع الموقع:

```
Settings → Pages → Build and deployment → Source: GitHub Actions
```

## ٦. أخبرني

بعدها قل لي «ارفع»، فأربط المشروع بالمستودع وأرفعه. كل رفع بعد ذلك ينشر الموقع تلقائياً.

## ملاحظات

- المفتاح ينتهي بعد سنة. قبل انتهائه أنشئ مفتاحاً جديداً واستبدله في الخطوة الرابعة.
- البطاقة الرقمية في مستودعها الخاص بها، ولا تتأثر بهذا المستودع.
- عن الترخيص: الموقع المنشور يعرض الخط كجزء من الموقع المبني، وهذا ما يسمح به الترخيص. أما المستودع الخاص فهو مكان تخزين لا يصل إليه أحد غيرك، لكن نص الترخيص يمنع رفع الخط إلى أي منصة رقمية، فقد يُفهم أنه يشمل المستودع الخاص أيضاً. إذا أردت تجنب هذا تماماً، نبني الموقع على جهازك وننشر الناتج منه، بدون مستودع خاص.
