(function() {
    // 1. هنا تكتب كلمات السر العادية مباشرة، وتقدر تغيرها أو تزيدها مستقبلاً بسهولة
    const allowedPasswords = [
        "MySecret2027",
        "WelcomePass",
        "123456"
    ];

    // 2. النصوص المترجمة للغات الثلاث (عربي، إنجليزي، فرنسي)
    const translations = {
        ar: {
            title: "موقع محمي",
            heading: "الرجاء إدخال كلمة المرور للدخول",
            placeholder: "كلمة السر هنا...",
            button: "دخول",
            error: "كلمة المرور غير صحيحة، حاول مجدداً!"
        },
        en: {
            title: "Protected Website",
            heading: "Please enter the password to proceed",
            placeholder: "Password here...",
            button: "Enter",
            error: "Incorrect password, please try again!"
        },
        fr: {
            title: "Site Protégé",
            heading: "Veuillez saisir le mot de passe pour continuer",
            placeholder: "Mot de passe ici...",
            button: "Entrer",
            error: "Mot de passe incorrect, veuillez réessayer!"
        }
    };

    // 3. تحديد لغة المتصفح تلقائياً لتظهر الصفحة باللغة المناسبة للزائر
    let userLang = navigator.language || navigator.userLanguage;
    userLang = userLang.substring(0, 2);
    if (!translations[userLang]) {
        userLang = "en"; // لغة افتراضية إذا كانت لغة المتصفح غير اللغات الثلاث
    }
    const t = translations[userLang];

    // الفحص: إذا كان الزائر قد كتب الباسورد صح من قبل، اتركه يرى الموقع
    if (sessionStorage.getItem("site_authenticated") === "true") {
        return; 
    }

    // إخفاء محتوى الموقع فوراً لمنع ظهوره قبل كتابة الباسورد
    document.documentElement.style.display = 'none';

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
        
        const input = document.createElement("input");
        input.type = "password";
        input.placeholder = t.placeholder;
        input.style.cssText = "width:100%; padding:12px; margin:15px 0; border:1px solid #ccc; border-radius:4px; box-sizing:border-box; font-size:16px;";
        
        const button = document.createElement("button");
        button.innerText = t.button;
        button.style.cssText = "background:#007bff; color:white; border:none; padding:12px 20px; border-radius:4px; cursor:pointer; width:100%; font-size:16px;";
        
        const errorDiv = document.createElement("div");
        errorDiv.style.cssText = "color:red; margin-top:15px; font-size:14px; display:none;";

        box.appendChild(heading);
        box.appendChild(input);
        box.appendChild(button);
        box.appendChild(errorDiv);
        document.body.appendChild(box);

        // التحقق من كلمة السر المكتوبة (مقارنة مباشرة بدون تشفير)
        button.addEventListener("click", function() {
            const typedPassword = input.value;

            if (allowedPasswords.includes(typedPassword)) {
                sessionStorage.setItem("site_authenticated", "true");
                location.reload(); // إعادة تحميل الموقع الأصلي
            } else {
                errorDiv.innerText = t.error;
                errorDiv.style.display = "block";
                input.value = "";
            }
        });

        // الدخول عند الضغط على Enter
        input.addEventListener("keypress", function(e) {
            if (e.key === "Enter") button.click();
        });
    });
})();
