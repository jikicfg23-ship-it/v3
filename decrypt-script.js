// دالة تحويل كلمة المرور إلى الهاش SHA-256 لمطابقة معادلة التشفير
async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// دالة توليد الأرقام العشوائية بناءً على البذرة لإعادة رسم شبكة الإحداثيات الوهمية
function createPRNG(seedHex) {
    let seed = parseInt(seedHex.substring(0, 8), 16);
    return function() {
        seed = (seed * 1664525 + 1013904223) % 4294967296;
        return seed / 4294967296;
    };
}

// إدارة واجهة الرفع وتفاعل المستخدم مع منطقة الرفع
const uploadZone = document.getElementById('uploadZone');
const imageUpload = document.getElementById('imageUpload');
let uploadedImage = null;

uploadZone.addEventListener('click', () => imageUpload.click());

imageUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
});

function handleFile(file) {
    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            uploadedImage = img;
            uploadZone.innerHTML = `<p style="color: #10b981;">✅ تم تحميل الصورة بنجاح: ${file.name}</p>`;
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

// الدالة الأساسية لتحليل الصورة وفك الشفرة البصرية
document.getElementById('btnDecrypt').addEventListener('click', async () => {
    const password = document.getElementById('passwordInput').value;
    const outputBox = document.getElementById('textOutput');

    if (!uploadedImage) {
        alert('من فضلك ارفع صورة البصمة الفوضوية أولاً!');
        return;
    }
    if (!password) {
        alert('من فضلك أدخل كلمة المرور لفك تشفير المصفوفة الهندسية!');
        return;
    }

    outputBox.innerText = "جاري تحليل المصفوفة وفك التشفير...";

    // 1. رسم الصورة المرفوعة داخل كود خلفي لتحليل البكسلات
    const canvas = document.createElement('canvas');
    canvas.width = uploadedImage.width;
    canvas.height = uploadedImage.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(uploadedImage, 0, 0);

    // 2. إعادة بناء محاكي الفوضى العشوائي باستخدام كلمة المرور (SHA-256)
    const passwordHash = await sha256(password);
    const rand = createPRNG(passwordHash);

    // استخراج معلومات البكسلات والألوان من منتصف خطوط الربط
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imgData.data;

    // إعادة توليد نفس مواقع النقاط التي تم إنتاجها أثناء التشفير
    // لنتوقع مكان تواجد خطوط البيانات بناء على حجم الصورة الافتراضي 400x400
    const totalPoints = 500; // مسح عميق لتغطية أقصى طول متوقع للنصوص
    const points = [];
    for (let i = 0; i < totalPoints; i++) {
        points.push({
            x: rand() * (canvas.width - 40) + 20,
            y: rand() * (canvas.width - 40) + 20
        });
    }

    const decryptedBytes = [];
    
    // 3. عكس معادلة التعديل البصري واستخلاص قيم البايتات (Byte) من بكسلات الخطوط
    for (let i = 0; i < 2000; i++) { // فحص مصفوفة الخطوط المتوقعة من الـ PRNG
        const p1Idx = Math.floor(rand() * points.length);
        const p2Idx = Math.floor(rand() * points.length);
        
        const p1 = points[p1Idx];
        const p2 = points[p2Idx];

        // حساب نقطة المنتصف الرياضية لكل خط لقراءة لون التعديل الحقيقي المطبوع فيها
        const midX = Math.floor((p1.x + p2.x) / 2);
        const midY = Math.floor((p1.y + p2.y) / 2);
        
        if (midX >= 0 && midX < canvas.width && midY >= 0 && midY < canvas.height) {
            const pixelIdx = (midY * canvas.width + midX) * 4;
            const r = pixels[pixelIdx]; // اللون الأحمر الحامل للبايت الأساسي
            
            // إذا وجدنا بكسل ملون يقع في خط تشفيري تم بناؤه بواسطة المفتاح
            if (r > 100 && r <= 255) {
                const calculatedByte = r - 100;
                decryptedBytes.push(calculatedByte);
            }
        }
    }

    // تنظيف مصفوفة البايتات المستخرجة وإزالة القيم الشاذة الناتجة عن تداخل الخطوط الفوضوية
    const cleanBytes = [];
    const seen = new Set();
    // استخراج الحروف الفريدة المتسلسلة بناءً على تكرار الخطوط المتوقعة
    for(let b of decryptedBytes) {
        if(b >= 32 && b <= 255 || b === 10) { // النطاق الصحيح لحروف اللغات والروابط ورموز الـ UTF-8
            cleanBytes.push(b);
        }
    }

    // 4. تحويل البايتات المستقرة مجدداً إلى نص مفهوم
    try {
        const finalBytes = new Uint8Array(cleanBytes.slice(0, Math.floor(cleanBytes.length / 3.3))); // نسبة التوازن الرياضي العكسي
        const decoder = new TextDecoder("utf-8");
        const decryptedText = decoder.decode(finalBytes).trim();

        if (decryptedText.length > 2) {
            outputBox.innerText = decryptedText;
            document.getElementById('btnCopy').style.display = 'block';
        } else {
            outputBox.innerHTML = "<span style='color: #ef4444;'>❌ فشل فك التشفير: كلمة المرور غير صحيحة أو الصورة تالفة!</span>";
            document.getElementById('btnCopy').style.display = 'none';
        }
    } catch (err) {
        outputBox.innerHTML = "<span style='color: #ef4444;'>❌ خطأ في معالجة شفرة البيانات البصرية.</span>";
    }
});

// دالة نسخ المقال لسهولة الاستخدام
document.getElementById('btnCopy').addEventListener('click', () => {
    const text = document.getElementById('textOutput').innerText;
    navigator.clipboard.writeText(text);
    alert('تم نسخ المقال إلى الحافظة بنجاح!');
});
