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

document.getElementById('btnDecrypt').addEventListener('click', async () => {
    const password = document.getElementById('passwordInput').value;
    const outputBox = document.getElementById('textOutput');

    if (!uploadedImage || !password) {
        alert('من فضلك ارفع الصورة وأدخل كلمة المرور!');
        return;
    }

    outputBox.innerText = "جاري قراءة خطوط الفوضى واستخراج النص الأساسي...";

    const canvas = document.createElement('canvas');
    canvas.width = uploadedImage.width;
    canvas.height = uploadedImage.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(uploadedImage, 0, 0);

    const passwordHash = await sha256(password);
    const rand = createPRNG(passwordHash);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imgData.data;

    const totalPoints = 300; 
    const points = [];
    for (let i = 0; i < totalPoints; i++) {
        points.push({
            x: rand() * (canvas.width - 40) + 20,
            y: rand() * (canvas.width - 40) + 20
        });
    }

    let base64Result = "";
    
    for (let i = 0; i < 1000; i++) {
        const p1Idx = Math.floor(rand() * points.length);
        const p2Idx = Math.floor(rand() * points.length);
        
        const p1 = points[p1Idx];
        const p2 = points[p2Idx];

        const midX = Math.floor((p1.x + p2.x) / 2);
        const midY = Math.floor((p1.y + p2.y) / 2);
        
        if (midX >= 0 && midX < canvas.width && midY >= 0 && midY < canvas.height) {
            const pixelIdx = (midY * canvas.width + midX) * 4;
            const r = pixels[pixelIdx];
            const b = pixels[pixelIdx + 2];
            
            if (b > 200 && r > 0) {
                base64Result += String.fromCharCode(r);
            }
        }
    }

    try {
        const cleanBase64 = base64Result.replace(/[^A-Za-z0-9+/=]/g, "");
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
        outputBox.innerHTML = "<span style='color: #ef4444;'>❌ فشل فك التشفير: كلمة المرور خاطئة أو جودة الصورة مشوشة!</span>";
        document.getElementById('btnCopy').style.display = 'none';
    }
});

document.getElementById('btnCopy').addEventListener('click', () => {
    const text = document.getElementById('textOutput').innerText;
    navigator.clipboard.writeText(text);
    alert('تم نسخ المقال المسترجع بنجاح!');
});
