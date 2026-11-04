async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function createPRNG(seedHex) {
    let seed = parseInt(seedHex.substring(0, 8), 16);
    return function() {
        seed = (seed * 1664525 + 1013904223) % 4294967296;
        return seed / 4294967296;
    };
}

const uploadZone = document.getElementById('uploadZone');
const imageUpload = document.getElementById('imageUpload');
let uploadedImage = null;

uploadZone.addEventListener('click', () => imageUpload.click());
imageUpload.addEventListener('change', (e) => {
    const file = e.target.files;
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

document.getElementById('btnDecrypt').addEventListener('click', async () => {
    const password = document.getElementById('passwordInput').value;
    const outputBox = document.getElementById('textOutput');

    if (!uploadedImage || !password) {
        alert('من فضلك ارفع الصورة وأدخل كلمة المرور!');
        return;
    }

    outputBox.innerText = "جاري قراءة خطوط الفوضى البكسلية المضمونة...";

    const canvas = document.createElement('canvas');
    canvas.width = uploadedImage.width;
    canvas.height = uploadedImage.height;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false; // إغلاق التنعيم أثناء الفك أيضاً
    ctx.drawImage(uploadedImage, 0, 0);

    const passwordHash = await sha256(password);
    const rand = createPRNG(passwordHash);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imgData.data;

    let base64Result = "";
    
    // فحص نفس الإحداثيات الصلبة المتولدة من الكلمة السرية بدقة متناهية
    for (let i = 0; i < 2000; i++) { 
        const x = Math.floor(rand() * canvas.width);
        const y = Math.floor(rand() * canvas.height);
        const pixelIdx = (y * canvas.width + x) * 4;

        const r = pixels[pixelIdx];     // يحمل الحرف المشفر
        const g = pixels[pixelIdx + 1]; // مفتاح التحقق الأخضر (77)

        // التحقق من أن البكسل يحتوي على شفرتنا الأصلية ولم يتأثر بالخلفية
        if (g === 77 && r > 0) {
            base64Result += String.fromCharCode(r);
        }
    }

    try {
        const cleanBase64 = base64Result.replace(/[^A-Za-z0-9+/=]/g, "").trim();
        
        // فك الترميز النصي النهائي المستقر
        const decodedString = atob(cleanBase64);
        const uint8Array = new Uint8Array(decodedString.length);
        for (let i = 0; i < decodedString.length; i++) {
            uint8Array[i] = decodedString.charCodeAt(i);
        }
        const finalMegal = new TextDecoder("utf-8").decode(uint8Array);

        if (finalMegal.length > 0) {
            outputBox.innerText = finalMegal;
            document.getElementById('btnCopy').style.display = 'block';
        } else {
            throw new Error();
        }
    } catch (err) {
        outputBox.innerHTML = "<span style='color: #ef4444;'>❌ فشل فك التشفير: تأكد من كتابة كلمة المرور الصحيحة بالملي، أو أن الصورة لم يتم تعديل حجمها!</span>";
        document.getElementById('btnCopy').style.display = 'none';
    }
});

document.getElementById('btnCopy').addEventListener('click', () => {
    const text = document.getElementById('textOutput').innerText;
    navigator.clipboard.writeText(text);
    alert('تم نسخ المقال المسترجع بنجاح!');
});
