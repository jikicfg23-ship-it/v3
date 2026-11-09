(function() {
    // 1. كلمات السر العادية (تستطيع تعديلها أو زيادتها هنا مباشرة)
    const allowedPasswords = [
        "MySecret2027",
        "WelcomePass",
        "123456"
    ];

    // 2. النصوص المترجمة للغات الثلاث
    const translations = {
        ar: {
            title: "موقع محمي",
            heading: "الرجاء إدخال كلمة المرور والدخول",
            placeholder: "كلمة السر هنا...",
            captchaPlaceholder: "اكتب رمز التحقق هنا...",
            button: "دخول",
            errorPass: "كلمة المرور غير صحيحة!",
            errorCaptcha: "رمز التحقق غير صحيح، حاول مجدداً!"
        },
        en: {
            title: "Protected Website",
            heading: "Please enter the password to proceed",
            placeholder: "Password here...",
            captchaPlaceholder: "Enter verification code...",
            button: "Enter",
            errorPass: "Incorrect password!",
            errorCaptcha: "Incorrect verification code, try again!"
        },
        fr: {
            title: "Site Protégé",
            heading: "Veuillez saisir le mot de passe pour continuer",
            placeholder: "Mot de passe ici...",
            captchaPlaceholder: "Entrez le code de vérification...",
            button: "Entrer",
            errorPass: "Mot de passe incorrect!",
            errorCaptcha: "Code de vérification incorrect, réessayez!"
        }
    };

    // 3. تحديد لغة المتصفح تلقائياً
    let userLang = navigator.language || navigator.userLanguage;
    userLang = userLang.substring(0, 2);
    if (!translations[userLang]) {
        userLang = "en"; 
    }
    const t = translations[userLang];

    // الفحص: إذا كان قد سجل دخوله مسبقاً، اتركه يرى الموقع
    if (sessionStorage.getItem("site_authenticated") === "true") {
        return; 
    }

    // إخفاء محتوى الموقع فوراً لمنع ظهوره قبل كتابة الباسورد والكابتشا
    document.documentElement.style.display = 'none';

    let currentCaptcha = "";

    // دالة لتوليد رمز كابتشا عشوائي مكون من 5 أرقام وحروف
    function generateCaptcha() {
        const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        let result = "";
        for (let i = 0; i < 5; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    document.addEventListener("DOMContentLoaded", function() {
        // تفريغ محتوى الصفحة الحالية لعرض شاشة القفل
        document.body.innerHTML = '';
        document.documentElement.style.display = 'block';
        document.title = t.title;
        document.body.style.cssText = "font-family:sans-serif; background:#f4f6f9; display:flex; justify-content:center; align-items:center; height:100vh; margin:0; direction:" + (userLang === 'ar' ? 'rtl' : 'ltr');

        // بناء صندوق تسجيل الدخول
        const box = document.createElement("div");
        box.style.cssText = "background:white; padding:30px; border-radius:8px; box-shadow:0 4px 15px rgba(0,0,0,0.1); text-align:center; max-width:400px; width:90%; box-sizing:border-box;";
        
        const heading = document.createElement("h2");
        heading.innerText = t.heading;
        heading.style.margin = "0 0 15px 0";
        heading.style.fontSize = "22px";
        
        // حقل كلمة السر
        const inputPass = document.createElement("input");
        inputPass.type = "password";
        inputPass.placeholder = t.placeholder;
        inputPass.style.cssText = "width:100%; padding:12px; margin:10px 0; border:1px solid #ccc; border-radius:4px; box-sizing:border-box; font-size:16px;";
        
        // حاوية الكابتشا (الرمز المولد + زر التحديث)
        const captchaContainer = document.createElement("div");
        captchaContainer.style.cssText = "display:flex; align-items:center; justify-content:center; gap:10px; margin:10px 0;";
        
        const captchaVisual = document.createElement("div");
        captchaVisual.style.cssText = "background:#e0e0e0; color:#333; font-weight:bold; font-style:italic; letter-spacing:4px; padding:10px 20px; font-size:20px; border-radius:4px; user-select:none; background-image: linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%); background-size: 10px 10px;";
        
        const refreshBtn = document.createElement("button");
        refreshBtn.innerHTML = "&#8635;"; // رمز التحديث
        refreshBtn.type = "button";
        refreshBtn.style.cssText = "background:#6c757d; color:white; border:none; padding:10px; border-radius:4px; cursor:pointer; font-size:16px; width:40px;";

        captchaContainer.appendChild(captchaVisual);
        captchaContainer.appendChild(refreshBtn);

        // دالة لتحديث الرمز المعروض
        function refreshCaptchaUI() {
            currentCaptcha = generateCaptcha();
            captchaVisual.innerText = currentCaptcha;
        }
        refreshCaptchaUI(); // توليد الرمز لأول مرة

        refreshBtn.addEventListener("click", refreshCaptchaUI);

        // حقل إدخال الكابتشا
        const inputCaptcha = document.createElement("input");
        inputCaptcha.type = "text";
        inputCaptcha.placeholder = t.captchaPlaceholder;
        inputCaptcha.style.cssText = "width:100%; padding:12px; margin:10px 0; border:1px solid #ccc; border-radius:4px; box-sizing:border-box; font-size:16px;";

        const buttonSubmit = document.createElement("button");
        buttonSubmit.innerText = t.button;
        buttonSubmit.style.cssText = "background:#007bff; color:white; border:none; padding:12px 20px; border-radius:4px; cursor:pointer; width:100%; font-size:16px; margin-top:10px;";
        
        const errorDiv = document.createElement("div");
        errorDiv.style.cssText = "color:red; margin-top:15px; font-size:14px; display:none;";

        box.appendChild(heading);
        box.appendChild(inputPass);
        box.appendChild(captchaContainer);
        box.appendChild(inputCaptcha);
        box.appendChild(buttonSubmit);
        box.appendChild(errorDiv);
        document.body.appendChild(box);

        // التحقق عند الضغط على زر الدخول
        buttonSubmit.addEventListener("click", function() {
            const typedPassword = inputPass.value;
            const typedCaptcha = inputCaptcha.value.trim();

            // 1. فحص كلمة السر أولاً
            if (!allowedPasswords.includes(typedPassword)) {
                errorDiv.innerText = t.errorPass;
                errorDiv.style.display = "block";
                inputPass.value = "";
                refreshCaptchaUI(); // تغيير الكابتشا للأمان عند الخطأ
                inputCaptcha.value = "";
                return;
            }

            // 2. فحص الكابتشا (مع تجاهل حالة الأحرف الكبيرة والصغيرة لراحة المستخدم)
            if (typedCaptcha.toLowerCase() !== currentCaptcha.toLowerCase()) {
                errorDiv.innerText = t.errorCaptcha;
                errorDiv.style.display = "block";
                refreshCaptchaUI();
                inputCaptcha.value = "";
                return;
            }

            // إذا كان كل شيء صحيحاً
            sessionStorage.setItem("site_authenticated", "true");
            location.reload(); 
        });

        // تشغيل الدخول بالضغط على Enter في أي من الحقلين
        const handleEnter = function(e) { if (e.key === "Enter") buttonSubmit.click(); };
        inputPass.addEventListener("keypress", handleEnter);
        inputCaptcha.addEventListener("keypress", handleEnter);
    });
})();
