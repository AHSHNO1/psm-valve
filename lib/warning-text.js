// موتورهای سایزینگ (سازگار با ISA/IEC و API 520) هشدار را به‌صورت کلید + پارامتر
// تولید می‌کنند تا متن در هر چهار زبان مهندسی یکسان بماند. کلیدهای ساده
// ("flashing") و کلیدهای variantدار ("backpressureHigh.danger.conventional",
// "letdown.mach") در همان دیکشنری ذخیره می‌شوند؛ variant از سطح‌بندی
// (w.type)، نوع شیر (w.params.type) و حالت محاسبه (scope) ساخته می‌شود تا
// یک کلیدِ موتور، پیام متفاوتِ هر شاخه را درست نگه دارد.

const BASE = {
  fa: {
    capacity: "Cv موردنیاز از ظرفیت بزرگ‌ترین سایز فهرست‌شده بیشتر است — با واحد مهندسی پتروسازه میهن مشورت کنید.",
    openingLow: "بازشدگی {opening}٪ کم است — برای کنترل بهتر، سایز کوچک‌تر در نظر بگیرید.",
    rangeability: "Cv موردنیاز کمتر از ۱۰٪ بازایمان سایز انتخابی است ({opening}٪) — تریم با Cv پایین‌تر یا شیر کوچک‌تر انتخاب کنید.",
    openingHigh: "بازشدگی {opening}٪ زیاد است — سایز بزرگ‌تر پیشنهاد می‌شود.",
    choked: "جریان خفّه (choked) شناسایی شد — سایز بزرگ‌تر یا افت فشار کمتر.",
    cavHigh: "خطر بالای کاویتاسیون (σ ≈ {sigma}) — تریم ضدکاویتاسیون پیشنهاد می‌شود.",
    cavMedium: "کاویتاسیون نزدیک حد آغازی (σ ≈ {sigma}) — نویز و سایش ترم را پایش کنید.",
    flashing: "فلاشینگ: فشار خروجی از فشار بخار کمتر است (P2 < Pv) — تریم فلاشینگ و متریال سخت‌کاری‌شده لازم است.",
    laminar: "جریان لامینار/گذار (Rev ≈ {Rev}، FR ≈ {FR}) — Cv برای ویسکوزیته تصحیح شده؛ با سازنده تأیید کنید.",
    velocity: "سرعت سیال در بدنه {velocity} m/s از راهنمای {limit} m/s بیشتر است — سایز بزرگ‌تر یا تریم چندمرحله‌ای.",
    mach: "عدد ماخ در بدنه {mach} از راهنمای {limit} بیشتر است ({velocity} m/s) — سایز بزرگ‌تر، تریم چندمرحله‌ای یا دیفیوزر خروجی.",
    minFlow: "در دبی مینیمم، شیر حدود {opening}٪ بازشدگی کار می‌کند — کنترل‌پذیری ضعیف است؛ تریم با Cv پایین‌تر یا مشخصهٔ درصدی.",

    // شیر اطمینان — API 520/526
    kdDefault: "Kd اولیه = {Kd} فرض شده — ضریب ظرفیت کاهیدهٔ تأییدشدهٔ ASME را از سازنده بگیرید.",
    temperatureUnits: "T = {T} شبیه درجهٔ سلسیوس است — این موتور در فرمول‌های API 520 دما را بر حسب کلوین می‌خواهد.",
    subcriticalFlow: "نسبت فشار پشتی {r} از نسبت بحرانی {criticalRatio} بیشتر است — جریان زیربحرانی است، ظرفیت کم می‌شود و معادلهٔ F2 به کار رفته است.",
    steamIndicative: "نتیجهٔ بخار راهنماست — انتخاب نهایی با جدول ظرفیت اسمی ASME/API 526 و Kd تأییدشدهٔ سازنده انجام شود.",
    liquidCoefficients: "تصحیح‌های Kv (ویسکوزیته) و Kw (اهرم) پیاده‌سازی نشده‌اند — برای تخلیهٔ مایع ویسکوس منحنی‌ها را از سازنده بگیرید.",
    overpressure: "اضافه‌فشار {overpressurePct}٪ تنها برای حالت آتش مجاز است (۱۰٪ غیرآتش، ۱۶٪ شیرهای چندنصبه، ۲۱٪ آتش).",
    "backpressureHigh.danger.conventional": "فشار پشتی {ratio}× فشار تنظیم است — بیش از حد ۱۰٪ برای شیر فنری متعارف؛ از شیر بالنسدیتقارن یا پایلوت‌اپراتور استفاده کنید.",
    "backpressureHigh.warning.conventional": "فشار پشتی حدود {ratio}× فشار تنظیم تخمینی است (۱۰٪ اضافه‌فشار فرض شده) و از حد ۱۰٪ شیر متعارف بیشتر است — فشار تنظیم را وارد کنید تا دقیق بررسی شود.",
    "backpressureHigh.danger.balanced": "فشار پشتی {ratio}× فشار تنظیم از محدودهٔ کاری ~۵۰٪ شیرهای بالنسدیتقارن بیشتر است — از شیر پایلوت‌اپراتور استفاده کنید.",
    "backpressureHigh.warning.balanced": "فراتر از ~۳۰٪ فشار پشتی، تصحیح ظرفیت بالنسد اعمال می‌شود — Kb را از منحنی سازنده بگیرید.",
    inletPressureLoss: "افت غیرقابل‌بازگشت ورودی {inletLossPct}٪ فشار تنظیم است — بیش از حد ۳٪ در API 520؛ خط ورودی را بزرگ‌تر کنید.",
    capacityMargin: "اوریفیس {letter} انتخابی با {utilisation}٪ ظرفیت کار می‌کند — بسیار بیش از نیاز؛ بزرگ‌انتخابی ریسک chatter و ناپایداری نشیمنگاه دارد، پایداری را با سازنده تأیید کنید.",
    "orificeInsufficient.danger": "سطح لازم {requiredCm2} cm² از بزرگ‌ترین اوریفیس فهرست‌شده ({maxCm2} cm²) بیشتر است — چند شیر یا بدنهٔ سفارشی لازم است.",

    // دی‌سوپرهیتر با تزریق آب
    "nearSaturation.danger": "دمای خروجی فقط {marginC} °C بالای اشباع ({tsat} °C) است — قطرات کامل تبخیر نمی‌شوند؛ دمای هدف را بالا ببرید یا در فشار کمتری تزریق کنید.",
    "nearSaturation.warning": "فاصلهٔ خروجی تا اشباع {marginC} °C است — برای جلوگیری از شوک حرارتی و فرسایش تریم آن را بالای حدود ۱۵ °C نگه دارید.",
    thermalShock: "{dT} °C سوپرهیت در یک مرحله گرفته می‌شود — دو نقطهٔ تزریق یا طول اختلاط بیشتر در نظر بگیرید؛ خستگی ناشی از شوک حرارتی علت رایج خرابی بدنه و تریم است.",
    sprayRatio: "آب تزریق {ratio}٪ دبی بخار است — بیش از حد عملی ~{limit}٪ برای یک نقطه؛ از لنس چندسوراخ با تأیید سازنده استفاده کنید.",
    "waterSupplyDP.warning": "فشار آب تغذیه وارد نشده — شیر تزریق سایز نشده است؛ فشار آب (و در صورت نیاز دمای آن) را وارد کنید.",
    "waterSupplyDP.danger": "فشار آب {waterPBar} bar از فشار ایستگاه {P1Bar} bar کمتر است — تزریق ممکن نیست؛ پمپ بوستر یا منبع آب بلندتر لازم است.",
    "waterSupplyDP.info": "شیر تزریق در حد خفّگی (کاویتاسیون) {dPmax} bar است — افت فشار اسپری جریان را تعیین می‌کند نه شیر.",
    "atomizingDP.danger": "افت فشار اسپریِ موجود {availableBar} bar از نیاز {needBar} bar اتمایزر کمتر است — قطرات اتمایز نمی‌شوند و آب در ایستگاه می‌بارد؛ فشار آب را بالا ببرید یا در فشار بخار کمتری تزریق کنید.",
    "atomizingDP.warning": "پس از افت {needBar} bar نازل، تنها {availableBar} bar روی شیر تزریق می‌ماند — اختیار کمی برای کنترل جریان است.",

    // لت‌داون
    wetInlet: "دمای ورودی {T1} °C در نقطهٔ اشباع ({tsat} °C) یا پایین‌تر است — بخار اشباع خشک در نظر گرفته شد؛ اگر بخار تر است کسری خشکی را وارد کنید.",
    "letdown.mach": "عدد ماخ خروجی تریم {mach} از راهنمای {limit} بیشتر است — مرحلهٔ کاهش فشار بیشتر یا تریم چندمرحله‌ای/چندهواره استفاده کنید (اکنون {stages} مرحله).",
    "outletMach.danger": "عدد ماخ فلنج خروجی {mach} ({velocity} m/s در DN{dn}) از راهنمای {limit} بیشتر است — خط خروجی کوچک است؛ خروجی بزرگ‌تر یا دیفیوزر در نظر بگیرید.",
    "outletMach.info": "عدد ماخ فلنج خروجی {mach} ({velocity} m/s) بین راهنمای بدنه و خروجی است — برای ایستگاه لت‌داون با خروجی باز‌شده قابل قبول.",
    "kineticEnergy.danger": "انرژی جنبشی خروجی {keWm2} W/m² معادل {ratio}× حد RP 75.23 ({limitWm2} W/m²) است — تعداد مراحل کاهش فشار را زیاد کنید (حدود {stages} مرحله پیشنهاد می‌شود) و خروجی را بزرگ‌تر بگیرید.",
    "kineticEnergy.warning": "انرژی جنبشی خروجی {keWm2} W/m² به حد RP 75.23 نزدیک است ({ratio}×) — سطح خروجی تریم را با سازنده تأیید کنید.",
    stages: "نسبت فشار P2/P1 = {ratio} — قاعدهٔ r ≤ {rule} تعداد {stages} مرحله کاهش فشار را پیشنهاد می‌کند؛ در یک مرحله جریان در تریم مافوق صوت می‌شود.",
    "letdown.choked": "مرحلهٔ حاکم خفّه است (x = {x} در برابر xChoked = {xChoked}) — محدودکنندهٔ جریان تریم است نه P2؛ تریم پلکانی یا شیر بزرگ‌تر لازم است.",
    outOfRange: "وضعیت خروجی در {P2} bar خارج از محدودهٔ جدول بخار است — دما و خشکی خروجی گزارش نشده.",
    wetSteam: "کاهش فشار آیزنتالپیک زیر نقطهٔ اشباع پایان می‌یابد — خشکی خروجی {dryness} (بخار تر)؛ فرسایش قطره‌ای تریم و نشیمنگاه انتظار می‌رود. سوپرهیت ورودی را بالا ببرید، پس از شیر دی‌سوپرهیتر بگذارید یا از تریم چندمرحله‌ای مقاوم در برابر فرسایش استفاده کنید.",
    "letdown.nearSaturation": "دمای خروجی فقط {marginC} °C بالای اشباع در فشار خروجی است — کم‌ترین اتلاف حرارت بخار را تر می‌کند؛ دی‌سوپرهیتر پس از شیر یا نقاط تخلیهٔ آب در نظر بگیرید.",
    superheatGain: "کاهش فشار عمیقِ بخار سوپرهیت می‌تواند دمای خروجی را بالا ببرد (مسیر آیزنتالپیک بالای حالت ورودی می‌گذرد) — کلاس لولهٔ پایین‌دست را بررسی کنید.",
    noise: "نویز تقریبی ≈ {noise} dB — پیش از تعیین تریم یا سایلنسر، محاسبهٔ واقعی IEC 60534-8-3 با دادهٔ کاهش صدای سازنده لازم است.",

    // سایزینگ دو‌فازی (HEM / HNE / ω)
    "twoPhase.nearSaturation": "فشار ورودی {P1} bar تا {relDiffPct}٪ با فشار بخار {Pv} bar فاصله دارد — سیال از دهانهٔ ورودی می‌جوشد و سایزینگ دو‌فازی در این سرویس الزامی است.",
    "twoPhase.inletTwoPhase.pv": "کسیر جرمی بخار ورودی x = {x} — جریان پیش از تریم دو‌فازی است و جوشش از دهانهٔ ورودی آغاز می‌شود؛ فشار بخارِ واردشده ({Pv} bar) از P1 کمتر است و در تعیین آغاز جوشش به کار نرفت، چون ورودی اشباع Pv = P1 دارد.",
    "twoPhase.inletTwoPhase.plain": "کسیر جرمی بخار ورودی x = {x} — جریان پیش از تریم دو‌فازی است و جوشش از دهانهٔ ورودی آغاز می‌شود.",
    "twoPhase.highVapourFraction": "کسیر بخار x = {x} از ۰٫۷ بیشتر است — مخلوط رفتار گاز/بخارِ فلشینگ دارد؛ با معادلهٔ گاز تک‌فازی سایز کنید و این نتیجهٔ دو‌فازی را فقط راستی‌آزمایی بدانید.",
    "twoPhase.hemOptimistic": "HEM تعادل کامل در گلوگاه فرض می‌کند، پس Cv آن کم‌ترین لازم است؛ در فلشینگِ واقعی بخیرزدن با تأخیر رخ می‌دهد. تفاوت با ω فقط چند درصد است و آن را حاشیهٔ ایمنی نخوانید — ضریب عدم‌تعادل N (HNE) جایگزین آن است.",
    "twoPhase.additiveCrude": "مدل جمع سادهٔ Cv = Cv_مایع + Cv_گاز تولید بخار و چگالی مخلوط در گلوگاه را نمی‌بیند و برای سرویس فلشینگ شیر را کوچک‌تر از حد لازم پیشنهاد می‌کند — فقط برای مقایسه است و قابل اتکا نیست.",
    "twoPhase.choked": "جریان دو‌فازی در مدل {model} خفّه است — با افت فشار بیشتر شار بالا نمی‌رود؛ تنها راهِ جریانِ بیشتر شیر بزرگ‌تر یا افت فشار کمتر است.",
    "twoPhase.dropSize": "سرعت مخلوط خروجی {velocity} m/s از راهنمای {limit} m/s فلشینگ آب بیشتر است (منطق انرژی جنبشی ISA RP75.23، نه حد سخت) — بدنهٔ بزرگ‌تر، خروجی باز‌شده یا دیفیوزر لازم است.",
    "twoPhase.shortResidence": "زمان اقامت تخمینی در گلوگاه ≈ {residenceMs} ms است — برای رسیدن به تعادل کاملِ فازی کم است؛ نتیجهٔ HNE یا ω واقع‌بینانه‌تر است.",
    "twoPhase.idealKd": "ضریب دبی ایده‌آل (Kd = ۱) در تبدیل Cv↔مساحت به کار رفته — برای تریم واقعی Kd ≈ ۰٫۸۵ است و Cv لازم را حدود ۱۵٪ بالا می‌برد.",
    "twoPhase.modelSpread": "چهار مدل دو‌فازی تا {ratio}× اختلاف دارند (Cv {minCv} … {maxCv}) — سایزینگ فلشینگ ذاتاً نامطمئن است؛ مدل انتخابی را در سفارش قید و با سازنده اعتبارسنجی کنید.",
    "twoPhase.propertiesOutOfRange": "خواص اشباع در فشار خروجی {P2} bar بیرون از دامنهٔ منبع خواصِ در حال استفاده ({propertySource}) است — کیفیت، دما و سرعت خروجی محاسبه نشده‌اند و Cv بالا تنها از مسیر گلوگاه می‌آید. برای آب MW را خالی بگذارید تا جدول بخار IAPWS به کار آید."
  },
  en: {
    capacity: "Required Cv exceeds the largest listed valve capacity — consult a valve engineer.",
    openingLow: "Opening {opening}% is low — consider a smaller valve size for better control.",
    rangeability: "Required Cv is below 10% of the selected trim rangeability ({opening}%) — pick a lower-Cv trim or smaller valve.",
    openingHigh: "Opening {opening}% is high — consider a larger valve size.",
    choked: "Choked flow detected — consider a larger valve or reduce the pressure drop.",
    cavHigh: "High cavitation risk (σ ≈ {sigma}) — consider anti-cavitation trim.",
    cavMedium: "Cavitation possible near the incipient limit (σ ≈ {sigma}) — monitor noise and trim wear.",
    flashing: "Flashing service: outlet pressure is below vapour pressure (P2 < Pv) — flashing trim and hardened materials required.",
    laminar: "Laminar/transition flow (Rev ≈ {Rev}, FR ≈ {FR}) — Cv corrected for viscosity; verify with the vendor.",
    velocity: "Body velocity {velocity} m/s exceeds the {limit} m/s guideline — consider a larger size or multi-stage trim.",
    mach: "Body Mach {mach} exceeds the {limit} guideline ({velocity} m/s) — consider a larger size, multi-stage trim or an outlet diffuser.",
    minFlow: "At minimum flow the valve runs at ~{opening}% opening — poor controlability; consider a lower-Cv trim or equal-percentage characteristic.",

    kdDefault: "Preliminary Kd = {Kd} assumed — use the ASME-certified reduced capacity coefficient from the manufacturer.",
    temperatureUnits: "T = {T} looks like °C — this engine expects Kelvin in the API 520 equations.",
    subcriticalFlow: "Backpressure ratio {r} is above the critical ratio {criticalRatio} — flow is subcritical, capacity drops and the F2 equation was used.",
    steamIndicative: "The steam result is indicative — make the final selection from the ASME/API 526 rated-capacity table with the vendor's certified Kd.",
    liquidCoefficients: "The Kv (viscosity) and Kw (leverage) corrections are not implemented — for viscous liquid relief take the curves from the vendor.",
    overpressure: "Overpressure {overpressurePct}% is only acceptable for a fire case (10% non-fire, 16% multiple valves, 21% fire).",
    "backpressureHigh.danger.conventional": "Backpressure is {ratio}× the set pressure — over the 10% limit for a conventional spring valve; use a balanced-bellows or pilot-operated valve.",
    "backpressureHigh.warning.conventional": "Backpressure is about {ratio}× the estimated set pressure (10% overpressure assumed) and over the conventional-valve 10% limit — enter the set pressure for a precise check.",
    "backpressureHigh.danger.balanced": "Backpressure {ratio}× of set exceeds the ~50% working range of bellows valves — use a pilot-operated valve.",
    "backpressureHigh.warning.balanced": "Beyond ~30% backpressure the bellows capacity correction applies — take Kb from the manufacturer curve instead of the estimate.",
    inletPressureLoss: "Inlet non-recoverable loss is {inletLossPct}% of set — above the API 520 3% limit; enlarge the inlet line.",
    capacityMargin: "The selected {letter} orifice runs at {utilisation}% — far above requirement; oversizing risks chatter and seat churn, so confirm stability with the vendor.",
    "orificeInsufficient.danger": "The required area {requiredCm2} cm² is larger than the biggest listed orifice ({maxCm2} cm²) — multiple valves or a custom body is needed.",

    "nearSaturation.danger": "The outlet is only {marginC} °C above saturation ({tsat} °C) — droplets will not fully evaporate; raise the target temperature or inject at a lower pressure.",
    "nearSaturation.warning": "The outlet approach to saturation is {marginC} °C — keep it above about 15 °C to avoid thermal shock and trim erosion.",
    thermalShock: "{dT} °C of superheat is removed in one stage — use two injection points or a longer mixing section; thermal-shock fatigue of the body and trim is the usual failure mode.",
    sprayRatio: "Injection water is {ratio}% of the steam flow — above the ~{limit}% practical limit for a single point; use a multi-hole lance with vendor confirmation.",
    "waterSupplyDP.warning": "Water supply pressure was not given — the injection valve is not sized; enter the water pressure (and temperature if needed).",
    "waterSupplyDP.danger": "Water supply {waterPBar} bar is below the station pressure {P1Bar} bar — injection is impossible; a booster pump or a raised water source is required.",
    "waterSupplyDP.info": "The injection valve is at its choked (cavitating) limit of {dPmax} bar — the spray ΔP assumption, not the valve, sets the flow.",
    "atomizingDP.danger": "Available spray ΔP {availableBar} bar is below the {needBar} bar atomising requirement — droplets will not atomise and the station will rain out; raise the water pressure or inject at a lower steam pressure.",
    "atomizingDP.warning": "Only {availableBar} bar remains across the injection valve after the {needBar} bar nozzle ΔP — little authority for flow control.",

    wetInlet: "Inlet temperature {T1} °C is at or below saturation ({tsat} °C) — treated as dry saturated steam; enter the dryness fraction if the steam is wet.",
    "letdown.mach": "Trim-exit Mach {mach} exceeds the {limit} guideline — use more reduction stages or a multi-stage/multi-hole trim (currently {stages} stage(s)).",
    "outletMach.danger": "Outlet-flange Mach {mach} ({velocity} m/s in DN{dn}) is above the {limit} guideline — the outlet line is too small; use a larger outlet DN or a diffuser.",
    "outletMach.info": "Outlet-flange Mach {mach} ({velocity} m/s) is between the body and outlet guidelines — acceptable for a letdown station with a properly expanded outlet.",
    "kineticEnergy.danger": "Outlet kinetic energy {keWm2} W/m² is {ratio}× the RP 75.23 limit ({limitWm2} W/m²) — add pressure-reduction stages (about {stages} suggested) and a larger outlet.",
    "kineticEnergy.warning": "Outlet kinetic energy {keWm2} W/m² is close to the RP 75.23 limit ({ratio}×) — confirm the trim outlet area with the vendor.",
    stages: "Pressure ratio P2/P1 = {ratio} — the r ≤ {rule} rule suggests {stages} reduction stage(s); a single stage would run supersonic in the trim.",
    "letdown.choked": "The governing stage is choked (x = {x} against xChoked = {xChoked}) — the trim, not P2, limits the flow; use a staged trim or a larger valve.",
    outOfRange: "The outlet state at {P2} bar is outside the steam-table range — outlet temperature and wetness are not reported.",
    wetSteam: "The isenthalpic letdown ends below saturation — outlet dryness {dryness} (wet steam); droplet erosion of trim and seat is expected. Raise the inlet superheat, add a desuperheater downstream, or use an erosion-resistant multi-stage trim.",
    "letdown.nearSaturation": "The outlet is only {marginC} °C above saturation at the outlet pressure — a small heat loss makes the steam wet; plan a downstream desuperheater or drain points.",
    superheatGain: "A deep letdown of superheated steam can raise the outlet temperature (the isenthalpic path passes above the inlet state) — check the downstream pipe class.",
    noise: "Indicative noise ≈ {noise} dB — before specifying trim or silencers, a real IEC 60534-8-3 calculation with vendor attenuation data is required.",

    // Two-phase (HEM / HNE / omega) sizing
    "twoPhase.nearSaturation": "Inlet pressure {P1} bar is within {relDiffPct}% of the vapour pressure {Pv} bar — the fluid flashes at the valve inlet, so two-phase sizing is mandatory for this service.",
    "twoPhase.inletTwoPhase.pv": "Inlet vapour mass fraction x = {x}: the stream is already two-phase upstream of the trim and flashing starts at the inlet; the entered vapour pressure ({Pv} bar) is below P1 and was not used for the flash onset, because a saturated inlet has Pv = P1.",
    "twoPhase.inletTwoPhase.plain": "Inlet vapour mass fraction x = {x}: the stream is already two-phase upstream of the trim and flashing starts at the valve inlet.",
    "twoPhase.highVapourFraction": "Vapour fraction x = {x} is above 0.7 — the mixture behaves as a gas/flashing vapour; size it with the single-phase gas equation and keep this two-phase result as a cross-check only.",
    "twoPhase.hemOptimistic": "HEM assumes full equilibrium at the throat, so its Cv is a lower bound — real flashing vapourises late. The gap to omega is only a few percent and is not a safety margin; the HNE non-equilibrium factor N is what covers it.",
    "twoPhase.additiveCrude": "The additive Cv = Cv_liquid + Cv_gas model ignores vapour generation and the mixture density at the throat, so it undersizes flashing service — shown for comparison only, not acceptable for design.",
    "twoPhase.choked": "Two-phase flow is choked in the {model} model — a deeper pressure drop no longer increases the mass flux; only a larger valve or a lower ΔP gives more flow.",
    "twoPhase.dropSize": "Outlet mixture velocity {velocity} m/s exceeds the {limit} m/s guideline for flashing water (the kinetic-energy thinking of ISA RP75.23, not a hard limit) — larger body, expanded outlet or a diffuser is needed.",
    "twoPhase.shortResidence": "Estimated trim residence time ≈ {residenceMs} ms — too short to reach full phase equilibrium; the HNE or omega result is the more realistic one.",
    "twoPhase.idealKd": "Ideal-orifice discharge coefficient (Kd = 1) used in the Cv↔area conversion — real trim is Kd ≈ 0.85, which raises the required Cv by about 15%.",
    "twoPhase.modelSpread": "The four two-phase models disagree by {ratio}× (Cv {minCv} … {maxCv}) — flashing-service sizing is genuinely uncertain; state the model used on the order and validate with the manufacturer.",
    "twoPhase.propertiesOutOfRange": "Saturation properties at the outlet pressure {P2} bar lie outside the property source in use ({propertySource}) — outlet quality, temperature and velocity are not computed and the Cv above comes from the throat path only. For water, leave MW empty so the IAPWS steam table is used."
  },
  ar: {
    capacity: "قيمة Cv المطلوبة تتجاوز سعة أكبر مقاس مدرج — راجع مهندس الصمامات.",
    openingLow: "نسبة الفتح {opening}٪ منخفضة — اختر مقاسًا أصغر لتحكم أفضل.",
    rangeability: "قيمة Cv المطلوبة أقل من ١٠٪ من مدى الفتح للمقاس المحدد ({opening}٪) — اختر تريمًا بـ Cv أقل أو صمامًا أصغر.",
    openingHigh: "نسبة الفتح {opening}٪ مرتفعة — يُقترح مقاس أكبر.",
    choked: "تم رصد تدفق مختنق — استخدم صمامًا أكبر أو خفّض هبوط الضغط.",
    cavHigh: "خطر كبير من التكهّف (σ ≈ {sigma}) — يُقترح تريم مضاد للتكهّف.",
    cavMedium: "احتمال تكهّف قرب الحد البدئي (σ ≈ {sigma}) — راقب الضوضاء وتآكل التريم.",
    flashing: "تبخّر سريع: ضغط المخرج أقل من ضغط البخار (P2 < Pv) — يتطلب تريمًا خاصًا ومواد مقسّاة.",
    laminar: "جريان صفائحي/انتقالي (Rev ≈ {Rev}، FR ≈ {FR}) — صُحح Cv اللزوجة؛ تحقق من الشركة المصنّعة.",
    velocity: "سرعة المائع في الجسم {velocity} م/ث تتجاوز الحد الإرشادي {limit} م/ث — اختر مقاسًا أكبر أو تريمًا متعدد المراحل.",
    mach: "رقم ماخ في الجسم {mach} يتجاوز الحد الإرشادي {limit} ({velocity} م/ث) — مقاس أكبر أو تريم متعدد المراحل أو ناشر مخرج.",
    minFlow: "عند أقل تدفق يعمل الصمام عند ~{opening}٪ من الفتح — قابلية تحكم ضعيفة؛ اختر تريمًا بـ Cv أقل أو خاصية نسبية.",

    kdDefault: "قُدِّر Kd المبدئي = {Kd} — استخدم معامل السعة المخفّض المعتمد من ASME الشركة المصنّعة.",
    temperatureUnits: "T = {T} يشبه درجة مئوية — معادلات API 520 تتوقع الحرارة بكلفن.",
    subcriticalFlow: "نسبة الضغط الخلفي {r} تتجاوز النسبة الحرجة {criticalRatio} — الجريان دون حرج وتنخفض السعة، استُخدمت معادلة F2.",
    steamIndicative: "نتيجة البخار إرشادية — اختر نهائيًا من جدول السعة الاسمية ASME/API 526 مع Kd المعتمد من المصنّع.",
    liquidCoefficients: "تصحيحا Kv (اللزوجة) وKw (الرافعة) غير مطبَّقين — لتصريف سائل لزج خذ المنحنيات من المصنّع.",
    overpressure: "الضغط الزائد {overpressurePct}٪ مقبول فقط في حالة الحريق (١٠٪ غير حريق، ١٦٪ صمامات متعددة، ٢١٪ حريق).",
    "backpressureHigh.danger.conventional": "الضغط الخلفي {ratio}× ضغط الضبط — يتجاوز حد ١٠٪ للصمام النبرتي التقليدي؛ استخدم صمامًا ببالون متوازن أو موصّلًا بالطيار.",
    "backpressureHigh.warning.conventional": "الضغط الخلفي نحو {ratio}× من ضغط الضبط المقدَّر (فُرض ١٠٪ ضغطًا زائدًا) ويتجاوز حد الصمام التقليدي — أدخل ضغط الضبط للتحقق الدقيق.",
    "backpressureHigh.danger.balanced": "الضغط الخلفي {ratio}× من ضغط الضبط يتجاوز نطاق عمل صمامات البالون (~٥٠٪) — استخدم صمامًا موصّلًا بالطيار.",
    "backpressureHigh.warning.balanced": "بعد ~٣٠٪ ضغط خلفي يُطبَّق تصحيح سعة البالون — خذ Kb من منحنى المصنّع بدل التقدير.",
    inletPressureLoss: "الفقد غير القابل للاستعادة في المدخل {inletLossPct}٪ من ضغط الضبط — يتجاوز حد ٣٪ في API 520؛ وسّع خط المدخل.",
    capacityMargin: "فتحة {letter} المحددة تعمل عند {utilisation}٪ — أعلى بكثير من المطلوب؛ التحديد الزائد يهدد بالطنين وعدم استقرار المقعد، تحقق من الاستقرار مع المصنّع.",
    "orificeInsufficient.danger": "المساحة المطلوبة {requiredCm2} سم² أكبر من أكبر فتحة مدرجة ({maxCm2} سم²) — يلزم عدة صمامات أو جسم خاص.",

    "nearSaturation.danger": "المخرج أعلى من التشبع بـ {marginC} °C فقط ({tsat} °C) — القطرات لن تتبخر بالكامل؛ ارفع الحرارة الهدف أو احقن بضغط أقل.",
    "nearSaturation.warning": "اقتراب المخرج من التشبع {marginC} °C — أبقِه فوق ~١٥ °C لتفادي الصدمة الحرارية وتآكل التريم.",
    thermalShock: "يُسحب {dT} °C من الحرارة الفائقة في مرحلة واحدة — استخدم نقطتي حقن أو مقطع خلط أطول؛ إعياء الصدمة الحرارية هو سبب العطل الشائع.",
    sprayRatio: "ماء الحقن {ratio}٪ من تدفق البخار — يتجاوز الحد العملي ~{limit}٪ لنقطة واحدة؛ استخدم قاذبة متعددة الثقوب مع تأكيد المصنّع.",
    "waterSupplyDP.warning": "لم يُعطَ ضغط ماء التغذية — صمام الحقن غير محدد المقاس؛ أدخل ضغط الماء (والحرارة إن لزم).",
    "waterSupplyDP.danger": "ضغط الماء {waterPBar} بار أقل من ضغط المحطة {P1Bar} بار — الحقن مستحيل؛ يلزم مضاعف أو مصدر ماء أعلى.",
    "waterSupplyDP.info": "صمام الحقن عند حد الاختناق (التكهّف) {dPmax} بار — هبوط ضغط الرش هو المحدد للتدفق لا الصمام.",
    "atomizingDP.danger": "هبوط الضغط المتاح للرش {availableBar} بار أقل من مطلوب التنويرة {needBar} بار — القطرات لن تتنوّر ويسقط الماء في المحطة؛ ارفع ضغط الماء أو احقن بضغط بخار أقل.",
    "atomizingDP.warning": "يتبقى {availableBar} بار فقط على صمام الحقن بعد هبوط الفوّهة {needBar} بار — صلاحية تحكم ضعيفة.",

    wetInlet: "حرارة المدخل {T1} °C عند التشبع ({tsat} °C) أو أقل — عوملت كبخار مشبع جاف؛ أدخل كسر الجفاف إن كان البخار رطبًا.",
    "letdown.mach": "رقم ماخ مخرج التريم {mach} يتجاوز الحد {limit} —زد مراحل خفض الضغط أو استخدم تريمًا متعدد المراحل/الثقوب (حاليًا {stages} مرحلة).",
    "outletMach.danger": "رقم ماخ شفة المخرج {mach} ({velocity} م/ث في DN{dn}) يتجاوز {limit} — خط المخرج صغير؛ استخدم DN مخرج أكبر أو ناشرًا.",
    "outletMach.info": "رقم ماخ شفة المخرج {mach} ({velocity} م/ث) بين حدي الجسم والمخرج — مقبول لمحطة خفض الضغط مع مخرج موسّع.",
    "kineticEnergy.danger": "الطاقة الحركية للمخرج {keWm2} واط/م² تعادل {ratio}× حد RP 75.23 ({limitWm2} واط/م²) — أضف مراحل خفض ضغط (~{stages} مقترحة) ووسّع المخرج.",
    "kineticEnergy.warning": "الطاقة الحركية للمخرج {keWm2} واط/م² قريبة من حد RP 75.23 ({ratio}×) — تحقق من مساحة مخرج التريم مع المصنّع.",
    stages: "نسبة الضغط P2/P1 = {ratio} — قاعدة r ≤ {rule} تقترح {stages} مرحلة خفض؛ المرحلة الواحدة تجعل الجريان فوق صوتي في التريم.",
    "letdown.choked": "المرحلة الحاكمة مختنقة (x = {x} مقابل xChoked = {xChoked}) — التريم لا P2 هو المحدد للتدفق؛ استخدم تريمًا متدرجًا أو صمامًا أكبر.",
    outOfRange: "حالة المخرج عند {P2} بار خارج مدى جدول البخار — لم تُعطَ حرارة الرطوبة أو المخرج.",
    wetSteam: "انخفاض الضغط متساوي الإنثالبتي ينتهي تحت التشبع — جفاف المخرج {dryness} (بخار رطب)؛ يُتوقع تآكل القطرات للتريم والمقعد. ارفع الحرارة الفائقة عند المدخل، أو أضف مزيل حرارة زائدة بعد الصمام، أو استخدم تريمًا متعدد المراحل مقاومًا للتآكل.",
    "letdown.nearSaturation": "المخرج أعلى من التشبع بـ {marginC} °C فقط عند ضغط المخرج — فقد حراري صغير يجعل البخار رطبًا؛ خطط لمزيل حرارة زائدة لاحقًا أو نقاط تصريف.",
    "twoPhase.nearSaturation": "ضغط المدخل {P1} بار يقع ضمن {relDiffPct}٪ من ضغط البخار {Pv} بار — المائع يغلي عند مدخل الصمام، لذا حساب الطورين إلزامي لهذه الخدمة.",
    "twoPhase.inletTwoPhase.pv": "كسر البخار الكتلي عند المدخل x = {x}: التيار ثنائي الطور قبل التريم والغليان يبدأ عند المدخل؛ ضغط البخار المُدخل ({Pv} بار) أقل من P1 ولم يُستخدم لتحديد بداية الغليان، لأن المدخل المشبع له Pv = P1.",
    "twoPhase.inletTwoPhase.plain": "كسر البخار الكتلي عند المدخل x = {x}: التيار ثنائي الطور قبل التريم، لذا يبدأ الغليان عند مدخل الصمام.",
    "twoPhase.highVapourFraction": "كسر البخار x = {x} أعلى من ٠٫٧ — الخليط يتصرف كبخار/غاز متبخر؛ احسبه بمعادلة الطور الواحد للغاز واقتصر بهذا النتيجة ثنائية الطور على التحقق.",
    "twoPhase.hemOptimistic": "نموذج HEM يفترض توازنًا كاملًا عند الخانق لذا فإن Cv حدّه الأدنى؛ التبخر الحقيقي يتأخر. الفرق مع ω بضعة بالمئة ولا يُعد هامش أمان — معامل عدم التوازن N في HNE هو ما يغطي ذلك.",
    "twoPhase.additiveCrude": "نموذج الجمع Cv = Cv_سائل + Cv_غاز يتجاهل تولد البخار وكثافة الخليط عند الخانق، فيقترح صمامًا أصغر من اللازم في خدمة الغليان — للمقارنة فقط ولا يصلح للتصميم.",
    "twoPhase.choked": "الجريان ثنائي الطور مختنق في نموذج {model} — زيادة هبوط الضغط لا ترفع تدفق الكتلة؛ السبيل الوحيد لمزيد من التدفق صمام أكبر أو هبوط أقل.",
    "twoPhase.dropSize": "سرعة الخليط عند المخرج {velocity} م/ث تتجاوز الحد الإرشادي {limit} م/ث لماء يغلي (منطق الطاقة الحركية في ISA RP75.23 وليس حدًا صارمًا) — يحتاج جسمًا أكبر أو مخرجًا موسعًا أو ناشرًا.",
    "twoPhase.shortResidence": "زمن المكث التقديري في التريم ≈ {residenceMs} ملي ثانية — أقصر من بلوغ التوازن الكامل؛ نتيجة HNE أو ω أقرب للواقع.",
    "twoPhase.idealKd": "استُخدم معامل تدفق مثالي (Kd = ١) في تحويل Cv↔مساحة — التريم الحقيقي Kd ≈ ٠٫٨٥ ما يرفع Cv المطلوب نحو ١٥٪.",
    "twoPhase.modelSpread": "النماذج الأربعة ثنائية الطور تختلف بمقدار {ratio}× (Cv من {minCv} إلى {maxCv}) — حساب الغليان غير مؤكد بطبيعته؛ اذكر النموذج المستخدم في أمر الشراء وتحقق من المصنّع.",
    "twoPhase.propertiesOutOfRange": "خصائص الإشباع عند ضغط المخرج {P2} بار خارج نطاق مصدر الخصائص المستخدم ({propertySource}) — لذا لم يُحسب جودة المخرج ودرجة حرارته وسرعته، وقيمة Cv أعلاه من مسار الخانق وحده. للماء اترك MW فارغًا ليُستخدم جدول بخار IAPWS.",
    superheatGain: "خفض الضغط العميق للبخار فائق التسخين قد يرفع حرارة المخرج (المسار متساوي الإنثالبتي يمر فوق حالة المدخل) — تحقق من تصنيف الأنبوب اللاحق.",
    noise: "ضوضاء إرشادية ≈ {noise} dB — قبل تحديد التريم أو كاتم الصوت يلزم حساب حقيقي IEC 60534-8-3 مع بيانات التخميد من المصنّع."
  },
  ru: {
    capacity: "Требуемый Cv превышает максимальную пропускную способность из списка — обратитесь к инженеру по арматуре.",
    openingLow: "Открытие {opening}% слишком мало — выберите меньший размер для лучшего регулирования.",
    rangeability: "Требуемый Cv ниже 10% диапазости выбранного размера ({opening}%) — выберите трим с меньшим Cv или арматуру меньше.",
    openingHigh: "Открытие {opening}% велико — рекомендуется больший размер.",
    choked: "Обнаружено критическое (задушенное) течение — увелиньте размер или снизьте перепад давления.",
    cavHigh: "Высокий риск кавитации (σ ≈ {sigma}) — рекомендуется антикавитационный трим.",
    cavMedium: "Возможна кавитация у зарождающегося предела (σ ≈ {sigma}) — контролируйте шум и износ трима.",
    flashing: "Флашинг: давление на выходе ниже давления насыщенного пара (P2 < Pv) — нужен трим для флашинга и упрочнённые материалы.",
    laminar: "Ламинарный/переходный режим (Rev ≈ {Rev}, FR ≈ {FR}) — Cv скорректирован по вязкости; уточните у изготовителя.",
    velocity: "Скорость в корпусе {velocity} м/с превышает ориентир {limit} м/с — выберите больший размер или многоступенчатый трим.",
    mach: "Число Маха в корпусе {mach} превышает ориентир {limit} ({velocity} м/с) — больший размер, многоступенчатый трим или диффузор на выходе.",
    minFlow: "При минимальном расходе клапан работает на ~{opening}% открытия — управляемость плохая; выберите трим с меньшим Cv или равнопроцентную характеристику.",

    kdDefault: "Предварительно принято Kd = {Kd} — используйте сертифицированный ASME понижающий коэффициент от изготовителя.",
    temperatureUnits: "T = {T} похоже на °C — уравнения API 520 требуют температуру в кельвинах.",
    subcriticalFlow: "Отношение противодавления {r} выше критического {criticalRatio} — течение доскритическое, пропускная способность падает, применено уравнение F2.",
    steamIndicative: "Результат для пара ориентировочный — окончательный выбор делайте по таблице номинальной способности ASME/API 526 с сертифицированным Kd изготовителя.",
    liquidCoefficients: "Поправки Kv (вязкость) и Kw (плечо) не реализованы — для слипшихся вязких жидкостей возьмите кривые у изготовителя.",
    overpressure: "Избыточное давление {overpressurePct}% допустимо только для пожара (10% не пожар, 16% несколько клапанов, 21% пожар).",
    "backpressureHigh.danger.conventional": "Противодавление составляет {ratio}× от давления настройки — выше предела 10% для обычного пружинного клапана; примените клапан с компенсационной сильфонной муфтой или с пилотным управлением.",
    "backpressureHigh.warning.conventional": "Противодавление ~{ratio}× от оценённого давления настройки (принято 10% избыточного) и выше предела 10% — введите давление настройки для точной проверки.",
    "backpressureHigh.danger.balanced": "Противодавление {ratio}× от настройки превышает рабочий диапазон сильфонных клапанов (~50%) — примените клапан с пилотным управлением.",
    "backpressureHigh.warning.balanced": "Свыше ~30% противодавления действует поправка способности сильфона — возьмите Kb из кривой изготовителя вместо оценки.",
    inletPressureLoss: "Необратимые потери на входе составляют {inletLossPct}% от давления настройки — выше предела 3% по API 520; увеличьте линию подвода.",
    capacityMargin: "Выбранное сопло {letter} работает на {utilisation}% — намного выше требуемого; переразмерение грозит дребезгом и неустойчивостью седла — подтвердите устойчивость у изготовителя.",
    "orificeInsufficient.danger": "Требуемая площадь {requiredCm2} см² больше самого большого сопла из списка ({maxCm2} см²) — нужны несколько клапанов или корпус на заказ.",

    "nearSaturation.danger": "Выход всего на {marginC} °C выше насыщения ({tsat} °C) — капли не испарятся полностью; повысьте целевую температуру или впрыскивайте при меньшем давлении.",
    "nearSaturation.warning": "Приближение выхода к насыщению {marginC} °C — держите выше ~15 °C, чтобы избежать теплового удара и эрозии трима.",
    thermalShock: "Снимается {dT} °C перегрева одной ступенью — используйте две точки впрыска или более длинный участок смешения; усталость от теплового удара — обычная причина отказа.",
    sprayRatio: "Вода впрыска составляет {ratio}% расхода пара — выше практического предела ~{limit}% для одной точки; примените многодырочную форсунку с подтверждением изготовителя.",
    "waterSupplyDP.warning": "Давление воды питания не задано — клапан впрыска не рассчитан; введите давление воды (при необходимости и температуру).",
    "waterSupplyDP.danger": "Давление воды {waterPBar} бар ниже давления станции {P1Bar} бар — впрыск невозможен; нужен бустерный насос или источник выше.",
    "waterSupplyDP.info": "Клапан впрыска на пределе задухания (кавитации) {dPmax} бар — расход задаёт допущение по перепаду распыла, а не клапан.",
    "atomizingDP.danger": "Доступный перепад распыла {availableBar} бар ниже требуемого {needBar} бар для атомизации — капли не распылятся, на станции будет дождь; повысьте давление воды или впрыскивайте при меньшем давлении пара.",
    "atomizingDP.warning": "После {needBar} бар перепада распылителя на клапане впрыска остаётся лишь {availableBar} бар — малый запас для регулирования.",

    wetInlet: "Температура на входе {T1} °C на уровне насыщения ({tsat} °C) или ниже — принято как сухой насыщенный пар; укажите степень сухости, если пар влажный.",
    "letdown.mach": "Число Маха на выходе трима {mach} превышает ориентир {limit} — добавьте ступени снижения давления или многоступенчатый/многодырочный трим (сейчас {stages} ступ.).",
    "outletMach.danger": "Число Маха на фланце выхода {mach} ({velocity} м/с в DN{dn}) выше ориентира {limit} — линия выхода мала; возьмите больший DN выхода или диффузор.",
    "outletMach.info": "Число Маха на фланце выхода {mach} ({velocity} м/с) между ориентирами корпуса и выхода — допустимо для станции дросселирования с расширенным выходом.",
    "kineticEnergy.danger": "Кинетическая энергия на выходе {keWm2} Вт/м² в {ratio}× превышает предел RP 75.23 ({limitWm2} Вт/м²) — добавьте ступени (~{stages} рекомендуется) и увеличьте выход.",
    "kineticEnergy.warning": "Кинетическая энергия на выходе {keWm2} Вт/м² близка к пределу RP 75.23 ({ratio}×) — подтвердите площадь выхода трима у изготовителя.",
    stages: "Отношение давлений P2/P1 = {ratio} — правило r ≤ {rule} рекомендует {stages} ступеней; на одной ступени течение в триме станет сверхзвуковым.",
    "letdown.choked": "Расчётная ступень задушена (x = {x} при xChoked = {xChoked}) — расход ограничивает трим, а не P2; нужен ступенчатый трим или больший клапан.",
    outOfRange: "Состояние на выходе при {P2} бар вне диапазона паровой таблицы — температура и влажность выхода не рассчитаны.",
    wetSteam: "Изоэнтальпийное дросселирование заканчивается ниже насыщения — степень сухости на выходе {dryness} (влажный пар); ожидается капельная эрозия трима и седла. Повысьте перегрев на входе, добавьте десуперхитер после клапана или примените износостойкий многоступенчатый трим.",
    "letdown.nearSaturation": "Выход всего на {marginC} °C выше насыщения при выходном давлении — небольшие теплопотери сделают пар влажным; предусмотрьте десуперхитер после клапана или точки дренажа.",
    superheatGain: "Глубокое дросселирование перегретого пара может повысить температуру выхода (изоэнтальпа проходит выше входного состояния) — проверьте класс трубы ниже по потоку.",
    noise: "Ориентировочный шум ≈ {noise} dB — перед выбором трима или глушителя нужен расчёт IEC 60534-8-3 с данными по ослаблению шума от изготовителя.",

    // Двухфазный расчёт (HEM / HNE / ω)
    "twoPhase.nearSaturation": "Давление на входе {P1} бар отличается от давления пара {Pv} бар всего на {relDiffPct}% — жидкость вскипает на входе в клапан, двухфазный расчёт обязателен.",
    "twoPhase.inletTwoPhase.pv": "Массовая доля пара на входе x = {x}: поток уже двухфазный до трима, вскипание начинается на входе; введённое давление пара ({Pv} бар) ниже P1 и не использовалось для начала вскипания, поскольку насыщенный вход имеет Pv = P1.",
    "twoPhase.inletTwoPhase.plain": "Массовая доля пара на входе x = {x}: поток уже двухфазный до трима, вскипание начинается на входе в клапан.",
    "twoPhase.highVapourFraction": "Доля пара x = {x} выше 0,7 — смесь ведёт себя как газ/флэшующий пар; считайте по однофазной газовой формуле, а двухфазный результат оставьте как перекрёстную проверку.",
    "twoPhase.hemOptimistic": "HEM предполагает полное равновесие в горле, поэтому его Cv — нижняя граница; в реальном флэше парообразование запаздывает. Расхождение с ω составляет несколько процентов и не является запасом прочности — его покрывает коэффициент неравновесия N (HNE).",
    "twoPhase.additiveCrude": "Модель сложения Cv = Cv_жидк + Cv_газ игнорирует парообразование и плотность смеси в горле и потому занижает клапан для флэш-сервиса — приведена только для сравнения, неприменима в дизайне.",
    "twoPhase.choked": "Двухфазное течение задушено в модели {model} — дальнейший рост перепада не увеличивает массовый поток; больше расхода даст только больший клапан или меньший перепад.",
    "twoPhase.dropSize": "Скорость смеси на выходе {velocity} м/с превышает ориентир {limit} м/с для флэша воды (логика кинетической энергии ISA RP75.23, не жёсткий предел) — нужен больший корпус, расширенный выход или диффузор.",
    "twoPhase.shortResidence": "Оценочное время пребывания в триме ≈ {residenceMs} мс — слишком мало для полного фазового равновесия; результат HNE или ω реалистичнее.",
    "twoPhase.idealKd": "В переводе Cv↔площадь использован коэффициент идеального сопла (Kd = 1) — реальный трим имеет Kd ≈ 0,85, что повышает требуемый Cv примерно на 15%.",
    "twoPhase.modelSpread": "Четыре двухфазные модели расходятся в {ratio}× (Cv {minCv} … {maxCv}) — расчёт флэш-сервиса принципиально неопределён; укажите модель в заказе и подтвердите у изготовителя.",
    "twoPhase.propertiesOutOfRange": "Паровые свойства при давлении на выходе {P2} бар вне диапазона используемого источника свойств ({propertySource}) — качество, температура и скорость на выходе не рассчитаны, Cv выше получен только по пути в горле. Для воды оставьте MW пустым, чтобы применялась таблица IAPWS."
  }
};

export const WARNING_TEXT = BASE;

// کلیدهای نامزد: مخصوص‌ترین (scope + سطح‌بندی + نوع شیر) و سپس عام؛
// بنابراین یک کلیدِ موتور می‌تواند متن شاخه‌های مختلف را جدا نگه دارد.
function candidates(w, scope) {
  const key = w && w.key ? w.key : "warning";
  const type = w && w.params && w.params.type;
  const sev = w && w.type;
  const variants = [];
  if (type && sev) variants.push(key + "." + sev + "." + type);
  if (sev) variants.push(key + "." + sev);
  if (type) variants.push(key + "." + type);
  variants.push(key);
  const out = [];
  if (scope) for (const v of variants) out.push(scope + "." + v);
  for (const v of variants) out.push(v);
  return out;
}

export function warningText(w, locale, scope) {
  const dict = BASE[locale] || BASE.en;
  const keys = candidates(w, scope);
  for (const k of keys) {
    if (dict[k]) return fill(dict[k], w.params);
  }
  for (const k of keys) {
    if (BASE.en[k]) return fill(BASE.en[k], w.params);
  }
  return w.text;
}

// پارامترِ بی‌جفت در قالب با خط تیره نمایش داده می‌شود تا پیام بدون مقدار نماند.
function fill(tpl, params) {
  const p = params || {};
  return tpl.replace(/\{([\w.]+)\}/g, (m, k) => (p[k] != null && p[k] !== "" ? String(p[k]) : "—"));
}
