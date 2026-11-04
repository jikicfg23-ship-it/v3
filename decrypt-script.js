async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function xorEncryptDecrypt(text, key) {
    const decoded = decodeURIComponent(escape(atob(text)));
    let result = "";
    for (let i = 0; i < decoded.length; i++) {
        result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
}

const imageUpload = document.getElementById('imageUpload');
const cameraUpload = document.getElementById('cameraUpload');
const uploadStatus = document.getElementById('uploadStatus');
const uploadZone = document.getElementById('uploadZone');

let selectedFileBlob = null;

document.getElementById('btnSelectFile').addEventListener('click', () => imageUpload.click());
document.getElementById('btnLaunchCamera').addEventListener('click', () => cameraUpload.click());

imageUpload.addEventListener('change', (e) => handleFile(e.target.files[0]));
cameraUpload.addEventListener('change', (e) => handleFile(e.target.files[0]));

function handleFile(file) {
    if (!file) return;
    selectedFileBlob = file;
    uploadZone.style.borderColor = "#10b981";
    uploadStatus.innerHTML = `<span style="color: #10b981; font-weight: bold;">✅ تم التقاط/تحميل الصورة بنجاح:<br><small>${file.name || 'صورة الكاميرا المباشرة'}</small></span>`;
}

document.getElementById('btnDecrypt').addEventListener('click', async () => {
    const password = document.getElementById('passwordInput').value;
    const outputBox = document.getElementById('textOutput');

    if (!selectedFileBlob) {
        alert('من فضلك التقط صورة أو ارفع ملف البصمة أولاً!');
        return;
    }
    if (!password) {
        alert('من فضلك أدخل كلمة المرور!');
        return;
    }

    outputBox.innerText = "جاري فحص بايتات الملف واستخراج الشفرة...";

    // قراءة بايتات الصورة المرفوعة مباشرة من الذاكرة دون المرور بتعديلات الكانفاس
    const reader = new FileReader();
    reader.onload = async function(e) {
        const bytes = new Uint8Array(e.target.result);
        const textData = new TextDecoder("utf-8").decode(bytes);
        
        // البحث عن العلامة السحرية المميزة داخل شفرة الملف
        const marker = "||CHAOS_KEY||";
        const markerIndex = textData.indexOf(marker);

        if (markerIndex === -1) {
            outputBox.innerHTML = "<span style='color: #ef4444;'>❌ فشل فك التشفير: هذه الصورة لا تحتوي على أي شفرة بايتات مخفية!</span>";
            return;
        }

        // عزل النص المشفر فقط
        const encryptedText = textData.substring(markerIndex + marker.length).trim();

        try {
            const key = await sha256(password);
            const decryptedText = xorEncryptDecrypt(encryptedText, key);

            if (decryptedText && decryptedText.length > 0) {
                outputBox.innerText = decryptedText;
                document.getElementById('btnCopy').style.display = 'block';
            } else {
                throw new Error();
            }
        } catch (err) {
            outputBox.innerHTML = "<span style='color: #ef4444;'>❌ فشل فك التشفير: كلمة المرور خاطئة تماماً!</span>";
            document.getElementById('btnCopy').style.display = 'none';
        }
    };
    
    reader.readAsArrayBuffer(selectedFileBlob);
});

document.getElementById('btnCopy').addEventListener('click', () => {
    const text = document.getElementById('textOutput').innerText;
    navigator.clipboard.writeText(text);
    alert('تم نسخ المقال المسترجعي بنجاح!');
});
