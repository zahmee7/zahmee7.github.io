# سيناريوهات الأفلام

```
Film scripts · MVP (3 films)
```

## القواعد العامة

- مدة الفيلم الكامل بين ٤٥ و ٦٠ ثانية.
- مقطع الحلقة القصير بين ٦ و ٨ ثوانٍ، بدون نص، ويُقتطع من مشهد في الفيلم نفسه. هذا المقطع يعمل تلقائياً داخل الملف قبل الضغط على تشغيل.
- لا يوجد تعليق صوتي. نص قصير على الشاشة مع موسيقى هادئة مرخّصة، حتى يُفهم الفيلم وهو صامت.
- نسختان من كل فيلم، عربية وإنجليزية، من نفس المشروع مع تبديل النصوص فقط.
- الألوان والخط من ملف الرموز التصميمية، والعنصر البصري الأساسي هو الورق والمجلدات والمربعات المضيئة.
- ممنوع في أي لقطة: رقم خاص بالجهة، أو شعار، أو لقطة من نظام داخلي، أو اسم شخص.
- كل الأرقام والرسوم في الأفلام افتراضية ومدوّرة.
- النصوص المكتوبة في الجداول أدناه هي نفسها النص المقروء الذي يظهر تحت الفيلم في الموقع، لمن لا يشاهد الفيديو.

## مواصفات التصدير

| Item | Spec |
|---|---|
| Master | 1920×1080, 30 fps, ProRes or high-bitrate H.264 |
| Mobile cut | 1080×1350 (4:5), same timing, text re-laid for portrait |
| Loop | 6–8 s, seamless, no text, no audio, 1280×720 |
| Web film | `film.mp4` H.264 ≤ 12 MB · `film-av1.mp4` AV1 ≤ 8 MB |
| Web loop | `loop.mp4` H.264 ≤ 1.5 MB · `loop-av1.mp4` AV1 ≤ 1 MB |
| Poster | `poster.png` 1920×1080 (the build converts it to AVIF/WebP) |
| Audio | AAC 128 kbps, around −16 LUFS |
| Language | `-en` and `-ar` versions of film and poster |

أوامر التصدير (يشغّلها لك مساعد البرمجة إذا وضعت الملف الأصلي في المجلد):

```
ffmpeg -i master-en.mov -c:v libx264 -preset slow -crf 22 -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 128k film-en.mp4
ffmpeg -i master-en.mov -c:v libsvtav1 -preset 6 -crf 34 -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 128k film-av1-en.mp4
ffmpeg -ss 00:00:14 -t 6 -i master-en.mov -vf scale=1280:-2 -an -c:v libx264 -crf 26 -pix_fmt yuv420p -movflags +faststart loop.mp4
ffmpeg -ss 00:00:14 -t 6 -i master-en.mov -vf scale=1280:-2 -an -c:v libsvtav1 -crf 38 -pix_fmt yuv420p loop-av1.mp4
```

الأدوات المقترحة، واحدة منها تكفي:

```
After Effects  (+ LottieFiles plugin for Lottie exports)
Jitter         (browser motion design, exports MP4 and Lottie)
Figma          (storyboard frames before animating)
```

## الفيلم ١: الجاهزية للمؤشر الوطني

```
ndi-readiness · 60 s · loop from scene 3
```

| # | Time | المشهد | EN on screen | AR على الشاشة |
|---|---|---|---|---|
| 1 | 0–6 | خلفية كحلية، وأوراق وأيقونات ملفات ورسائل تطفو متفرقة في كل اتجاه. | Evidence everywhere. | أدلة في كل مكان. |
| 2 | 6–14 | الأوراق تطير وتستقر في شبكة من خمسة عشر مربعاً، لكل مربع أيقونة مجال عامة. | First, map every piece to its domain. | أولاً: ربط كل دليل بمجاله. |
| 3 | 14–24 | المربعات تضيء بدرجات مختلفة، والمربعات الباهتة تنبض بهدوء. | Then see where the gaps are. | ثم رؤية مواضع الفجوات. |
| 4 | 24–36 | المربعات الباهتة تنزلق إلى قائمة، والأعمدة تعيد ترتيب نفسها من الأطول للأقصر. | Rank them by impact and effort. | ترتيبها حسب الأثر والجهد. |
| 5 | 36–48 | القائمة تتحول إلى خط زمني، وبجانب كل بند دائرة ترمز لمسؤول. | Turn the list into a plan the team can work through. | تحويلها إلى خطة يعمل عليها الفريق. |
| 6 | 48–60 | كل شيء ينطوي في بطاقة واحدة، ثم يُغلق المجلد، ثم بطاقة الختام. | One readiness picture. · Try the readiness tracker | صورة جاهزية واحدة. · جرّب متتبع الجاهزية |

## الفيلم ٢: تصنيف البيانات بشكل عملي

```
data-classification · 60 s · loop from scene 3
```

مستويات التصنيف المستخدمة هي المستويات العامة المنشورة في سياسة تصنيف البيانات الوطنية.

| # | Time | المشهد | EN on screen | AR على الشاشة |
|---|---|---|---|---|
| 1 | 0–7 | بطاقة سجل بيانات عليها علامة استفهام، وأمامها أربعة صناديق مغلقة. | Every dataset needs a label. Which one? | كل مجموعة بيانات تحتاج تصنيفاً. أيّها؟ |
| 2 | 7–18 | ثلاث بطاقات أسئلة تظهر واحدة بعد الأخرى. | Who is affected if it leaks? · How badly? · Is it already public? | من يتأثر لو تسربت؟ · إلى أي حد؟ · هل هي منشورة أصلاً؟ |
| 3 | 18–30 | مؤشر الأثر يتحرك، ثم ينزلق السجل إلى صندوق مقيد. | Answer the impact questions, and the level follows. | أجب عن أسئلة الأثر، والتصنيف يتبعها. |
| 4 | 30–42 | من الصندوق تنفتح ثلاث قواعد: من يطّلع، وكيف تُشارك، وأين تُحفظ. | Each level comes with clear handling rules. | ولكل مستوى قواعد تعامل واضحة. |
| 5 | 42–52 | أيقونات مبانٍ لإدارات مختلفة، وكل واحدة تستلم نفس صفحة الدليل. | One practical guide for every department. | دليل عملي واحد لكل الإدارات. |
| 6 | 52–60 | بطاقة الختام. | Try the classification helper | جرّب مساعد التصنيف |

أسماء الصناديق الأربعة:

| EN | AR |
|---|---|
| Top Secret | سري للغاية |
| Secret | سري |
| Restricted | مقيد |
| Public | عام |

## الفيلم ٣: لوحة المتابعة التنفيذية

```
executive-dashboard · 60 s · loop from scene 3
```

| # | Time | المشهد | EN on screen | AR على الشاشة |
|---|---|---|---|---|
| 1 | 0–7 | عدة نوافذ جداول متداخلة، وأرقامها مموهة وغير مقروءة. | Progress lived in separate spreadsheets. | كان التقدم موزعاً على ملفات منفصلة. |
| 2 | 7–18 | النوافذ تنطوي إلى خطوط بيانات تتدفق نحو نموذج واحد في المنتصف. | Bring them into one model. | جمعها في نموذج واحد. |
| 3 | 18–32 | اللوحة تُبنى: بطاقات مؤشرات تنزل، وأعمدة تنمو، وخط يُرسم. | Operational excellence · Maturity · Compliance | التميز التشغيلي · النضج · الامتثال |
| 4 | 32–44 | زر تصفية يتبدل، والرسوم تتحرك إلى القيم الجديدة. | One view, up to date, easy to filter. | صورة واحدة محدّثة وسهلة التصفية. |
| 5 | 44–52 | الكاميرا تبتعد، واللوحة معروضة على شاشة قاعة اجتماعات. | The view management uses to follow the office. | الصورة التي تتابع بها الإدارة المكتب. |
| 6 | 52–60 | بطاقة الختام. | Open the sample dashboard | افتح اللوحة التجريبية |

## بطاقة الختام (لكل الأفلام)

- ثلاث ثوانٍ ثابتة.
- عنوان المشروع، ثم نص الزر، ثم الاسم في الأسفل.
- نفس خلفية الموقع الكحلية، والزر بلون الورق.

## ترتيب العمل المقترح

١. ارسم لوحة القصة بإطار واحد لكل مشهد.

٢. ابنِ الفيلم الأول كاملاً بالإنجليزية.

٣. بدّل النصوص وصدّر النسخة العربية.

٤. اقتطع مقطع الحلقة.

٥. ضع الملفات الأصلية في هذا المجلد، واطلب من مساعد البرمجة التصدير والضغط:

```
films/<project-id>/
```
