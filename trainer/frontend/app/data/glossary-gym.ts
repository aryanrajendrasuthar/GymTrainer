import { type GlossaryTerm } from "./glossary";

export const gymGlossaryTerms: GlossaryTerm[] = [
  // ─── Training Principles ───────────────────────────────────────────────────

  {
    id: "progressive-overload",
    term: "Progressive Overload",
    category: "assessment",
    shortDefinition: "Systematically increasing training stimulus over time to force continued adaptation.",
    fullDefinition:
      "The foundational principle of strength and hypertrophy training: the body adapts to a given training stimulus, so the stimulus must be progressively increased to continue producing adaptation. Overload can be applied by increasing load (weight), volume (sets × reps), density (less rest), frequency (training days), range of motion, tempo, or exercise difficulty. Overload applied too rapidly causes overuse injury; too slowly produces accommodation (plateaus). The minimum effective dose — the smallest increment of overload needed to produce adaptation — is typically 2.5 kg for upper body and 5 kg for lower body compound lifts per session.",
    relatedTerms: ["rep-range", "rpe", "periodisation", "progressive-overload-kg"],
  },

  {
    id: "hypertrophy",
    term: "Hypertrophy",
    category: "assessment",
    shortDefinition: "Increase in muscle fibre cross-sectional area from training-induced protein synthesis.",
    fullDefinition:
      "An increase in skeletal muscle size resulting from net positive muscle protein balance — protein synthesis exceeding breakdown. Myofibrillar hypertrophy refers to growth of the contractile proteins (actin and myosin) and is maximised by heavy compound loading (6–12 reps, 70–85% 1RM). Sarcoplasmic hypertrophy refers to increase in intramuscular glycogen, water, and enzyme stores. Both contribute to muscle growth. Key drivers: mechanical tension (primary), metabolic stress (secondary), muscle damage (tertiary). Optimal rep range: 6–20 reps with proximity to failure; rest: 60–180 seconds; frequency: each muscle group 2× per week.",
    relatedTerms: ["progressive-overload", "rep-range", "muscle-protein-synthesis", "1rm"],
  },

  {
    id: "1rm",
    term: "One-Rep Maximum (1RM)",
    category: "assessment",
    shortDefinition: "The maximum load that can be lifted for exactly one full repetition.",
    fullDefinition:
      "The gold standard measure of absolute strength for an exercise — the heaviest load that can be lifted through a full range of motion with correct form for a single repetition. Direct 1RM testing is time-intensive and carries injury risk for beginners; estimated 1RM can be calculated from submaximal efforts using equations (Epley: weight × [1 + (reps / 30)]). Training zones are expressed as %1RM: strength (>85%), hypertrophy (65–85%), muscular endurance (<65%). In practice, RPE-based training accounts for day-to-day variation more accurately than fixed %1RM.",
    relatedTerms: ["rpe", "rep-range", "progressive-overload", "strength"],
  },

  {
    id: "rpe",
    term: "Rate of Perceived Exertion (RPE)",
    category: "assessment",
    shortDefinition: "A subjective 1–10 scale of how hard a set feels, with 10 being muscular failure.",
    fullDefinition:
      "In strength training, RPE is used on a modified Borg 1–10 scale (also called the Reps in Reserve / RIR scale): RPE 10 = failure; RPE 9 = 1 rep left in the tank; RPE 8 = 2 reps; RPE 7 = 3 reps. This autoregulation method is superior to fixed %1RM programming because it accounts for daily fluctuations in strength (sleep quality, fatigue, stress). Research shows RPE 7–9 is sufficient for hypertrophy and strength gains in trained individuals. For beginners, RPE 6–7 reduces injury risk while still producing substantial adaptation.",
    relatedTerms: ["1rm", "progressive-overload", "reps-in-reserve", "autoregulation"],
  },

  {
    id: "periodisation",
    term: "Periodisation",
    category: "assessment",
    shortDefinition: "Systematic variation of training volume and intensity over time to optimise performance.",
    fullDefinition:
      "The planned manipulation of training variables (volume, intensity, frequency, exercise selection) across organised time blocks to maximise adaptation and minimise overtraining. Linear periodisation decreases volume while increasing intensity over a mesocycle. Undulating periodisation varies volume and intensity within each week (daily or weekly undulation). Block periodisation separates accumulation (volume), transmutation (intensity), and realisation (peaking) phases. Non-linear periodisation uses session-by-session autoregulation. For hypertrophy and general fitness, a 4-week mesocycle with a deload week every 4–6 weeks is the standard evidence-based approach.",
    relatedTerms: ["progressive-overload", "deload", "mesocycle", "volume"],
  },

  {
    id: "rep-range",
    term: "Rep Range",
    category: "assessment",
    shortDefinition: "The number of repetitions performed per set, targeting different training outcomes.",
    fullDefinition:
      "The number of repetitions in a working set determines the training stimulus. Strength (1–5 reps, >85% 1RM): maximises neuromuscular efficiency and myofibrillar density. Hypertrophy (6–20 reps, 65–85% 1RM): all rep ranges produce similar hypertrophy when taken near failure; most practical range is 8–15. Muscular endurance (20+ reps): metabolic conditioning, minimal hypertrophy. Emerging research (Schoenfeld 2017) demonstrated equivalent hypertrophy from 8–12 reps and 25–35 reps when sets are taken close to failure. Practical recommendation: use multiple rep ranges across a programme to maximise both mechanical tension and metabolic stress.",
    relatedTerms: ["progressive-overload", "rpe", "hypertrophy", "1rm"],
  },

  {
    id: "volume",
    term: "Training Volume",
    category: "assessment",
    shortDefinition: "The total number of hard sets performed per muscle group per week.",
    fullDefinition:
      "In contemporary hypertrophy research, volume is defined as the number of sets taken close to failure per muscle per week (MEV: minimum effective volume; MAV: maximum adaptive volume; MRV: maximum recoverable volume). Evidence-based MEV is approximately 10–15 sets per muscle group per week; MAV is 15–25 sets; MRV varies widely by individual and training age. Volume is the primary driver of hypertrophy — more important than intensity or frequency for muscle growth. Volume should increase progressively over a mesocycle and reset after a deload.",
    relatedTerms: ["periodisation", "progressive-overload", "deload", "mev"],
  },

  {
    id: "deload",
    term: "Deload",
    category: "assessment",
    shortDefinition: "A planned reduction in training volume or intensity to allow recovery and supercompensation.",
    fullDefinition:
      "A deload is a structured period of reduced training stress — typically 1 week — inserted every 4–8 weeks to allow systemic recovery, reduce accumulated fatigue, and facilitate supercompensation. Passive deload (complete rest) is rarely necessary; an active deload reducing volume by 40–60% while maintaining intensity is more effective at preserving adaptations. Deloads are particularly important when approaching maximum recoverable volume, when sleep quality has declined, when joint tenderness is present, or before a competition or testing week. Skipping deloads is the primary cause of overtraining syndrome in recreational athletes.",
    relatedTerms: ["periodisation", "volume", "overtraining", "supercompensation"],
  },

  {
    id: "compound-movement",
    term: "Compound Movement",
    category: "assessment",
    shortDefinition: "Multi-joint exercise recruiting multiple muscle groups simultaneously.",
    fullDefinition:
      "An exercise that involves two or more joints and recruits multiple muscle groups in a coordinated pattern. Examples: barbell squat (hip, knee, ankle, lumbar spine), bench press (shoulder, elbow), deadlift (hip, knee, lumbar, shoulder). Compound movements are the foundation of strength and hypertrophy programmes because they maximise mechanical tension across multiple muscles, allow the heaviest absolute loads, and produce the greatest hormonal and systemic response. They should constitute the majority of training volume (60–80%), supplemented by isolation exercises for lagging muscle groups.",
    relatedTerms: ["isolation-movement", "hypertrophy", "progressive-overload", "squat"],
  },

  {
    id: "isolation-movement",
    term: "Isolation Movement",
    category: "assessment",
    shortDefinition: "Single-joint exercise targeting one muscle group with minimal synergist involvement.",
    fullDefinition:
      "An exercise that moves through a single joint and isolates one primary muscle group, minimising contribution from synergists and stabilisers. Examples: biceps curl (elbow flexion), leg extension (knee extension), cable lateral raise (shoulder abduction). Isolation exercises complement compound movements by addressing muscle groups underserved by compound patterns (e.g., lateral deltoid, biceps brachii) or providing targeted hypertrophy stimulus without systemic fatigue. Typically programmed at the end of a session in the 12–20 rep range with shorter rest intervals.",
    relatedTerms: ["compound-movement", "hypertrophy", "rep-range", "volume"],
  },

  {
    id: "mind-muscle-connection",
    term: "Mind-Muscle Connection",
    category: "assessment",
    shortDefinition: "The intentional focus on contracting a specific muscle during exercise to enhance activation.",
    fullDefinition:
      "The deliberate attentional focus on the target muscle during an exercise, resulting in increased EMG activation and preferential recruitment of that muscle. Research (Calatayud 2016, Schoenfeld 2016) shows that internal focus (thinking about the muscle contracting) produces greater activation versus external focus (thinking about the movement or load) — particularly for isolation exercises and with loads below 80% 1RM. Less relevant at very heavy loads where gross force production dominates. Most practically applicable during isolation exercises, the top/peak contraction of compound movements, and rehabilitation.",
    relatedTerms: ["isolation-movement", "hypertrophy", "muscle-activation", "neuromuscular"],
  },

  {
    id: "eccentric-loading",
    term: "Eccentric Loading",
    category: "assessment",
    shortDefinition: "The lengthening phase of a muscle contraction, producing greater force than concentric.",
    fullDefinition:
      "Eccentric (lengthening) contractions occur when a muscle generates force while lengthening — the lowering phase of a squat, the descent of a push-up, the lowering of a bicep curl. Eccentric contractions produce approximately 20–40% more force than concentric contractions (the lifting phase) and cause greater muscle damage and delayed onset muscle soreness (DOMS). In rehabilitation, eccentric loading is the primary stimulus for tendon collagen remodelling in tendinopathy (Alfredson eccentric heel drop protocol). Eccentric overload can be achieved by lengthening the lowering phase (3–5 seconds), using a weight that requires a spotter to lift concentrically, or using accommodating resistance.",
    relatedTerms: ["achilles-tendinopathy", "progressive-overload", "tendinopathy-continuum", "doms"],
  },

  {
    id: "time-under-tension",
    term: "Time Under Tension (TUT)",
    category: "assessment",
    shortDefinition: "The total duration a muscle is under load during a set.",
    fullDefinition:
      "The cumulative duration of muscular loading within a set, calculated as (concentric tempo + pause + eccentric tempo) × reps. Longer TUT (>40 seconds per set) promotes metabolic stress and is associated with greater hypertrophy at moderate loads. Shorter TUT (<20 seconds) at very heavy loads favours strength through mechanical tension. Standard hypertrophy tempo: 2–3 seconds eccentric, 1-second pause, 1–2 seconds concentric (2010 to 3010 notation). Slowing the eccentric phase is the most practical manipulation — it increases time under tension without changing load or rep count.",
    relatedTerms: ["hypertrophy", "eccentric-loading", "rep-range", "volume"],
  },

  {
    id: "supersets",
    term: "Supersets",
    category: "assessment",
    shortDefinition: "Performing two exercises back-to-back with no rest between them.",
    fullDefinition:
      "A training technique where two exercises are performed consecutively without rest. Agonist supersets: two exercises for the same muscle (e.g., incline press + dumbbell fly) — increases metabolic stress and time efficiency. Antagonist supersets: opposing muscle groups (e.g., bench press + barbell row) — allows near-full recovery of each muscle, increasing session density without compromising strength. Pre-exhaustion supersets: isolation exercise before a compound (e.g., lateral raise before overhead press) — forces greater compound exercise activation. Research supports antagonist supersets for maintaining performance while reducing total session time by 30–40%.",
    relatedTerms: ["volume", "time-under-tension", "isolation-movement", "compound-movement"],
  },

  {
    id: "drop-set",
    term: "Drop Set",
    category: "assessment",
    shortDefinition: "Reducing the weight immediately after failure to extend a set with additional reps.",
    fullDefinition:
      "An advanced intensity technique where, upon reaching concentric failure, the load is immediately reduced (typically by 20–30%) and reps are continued until the next failure. Effective at maximising metabolic stress and intra-set fatigue but impractical for beginners due to high CNS and muscular fatigue. Most appropriate for isolation exercises in the final set of a muscle group's training. Cluster drop sets (multiple drops in one set) significantly increase training density. Evidence suggests drop sets produce equivalent hypertrophy to straight sets when total volume is equated, but they are more time-efficient.",
    relatedTerms: ["rpe", "volume", "hypertrophy", "time-under-tension"],
  },

  {
    id: "protein-synthesis",
    term: "Muscle Protein Synthesis (MPS)",
    category: "assessment",
    shortDefinition: "The cellular process of building new muscle proteins in response to training and nutrition.",
    fullDefinition:
      "Muscle protein synthesis (MPS) is the anabolic process by which muscle cells synthesise new contractile and structural proteins, driven by mechanical loading and amino acid availability (particularly leucine). After a resistance training session, MPS is elevated for 24–48 hours. Peak MPS requires 0.4 g/kg of leucine-rich protein per meal (approximately 30–40 g of whey or equivalent). Total daily protein intake of 1.6–2.2 g/kg body weight maximises MPS across the day. Spreading protein evenly across 3–5 meals is superior to two large meals. Pre-sleep protein (casein) extends overnight MPS by 25%.",
    relatedTerms: ["hypertrophy", "progressive-overload", "nutrition", "leucine"],
  },

  {
    id: "doms",
    term: "Delayed Onset Muscle Soreness (DOMS)",
    category: "assessment",
    shortDefinition: "Muscle pain and stiffness peaking 24–72 hours after unaccustomed eccentric exercise.",
    fullDefinition:
      "A normal physiological response to novel or eccentric-heavy exercise, characterised by diffuse muscle tenderness, stiffness, reduced strength, and swelling peaking 24–72 hours post-exercise. Caused by microstructural muscle damage — particularly z-disc disruption — triggering local inflammation and mechanoreceptor sensitisation. DOMS does not indicate hypertrophic stimulus quality (the repeated bout effect reduces DOMS without reducing hypertrophy). Management: light active recovery, sleep, adequate protein, and anti-inflammatory modalities (cold water immersion) can reduce DOMS severity. DOMS should not be used as a training progress marker.",
    relatedTerms: ["eccentric-loading", "hypertrophy", "progressive-overload", "recovery"],
  },

  {
    id: "amrap",
    term: "AMRAP",
    category: "assessment",
    shortDefinition: "As Many Reps (or Rounds) As Possible — a maximal effort set or time block.",
    fullDefinition:
      "An acronym with two common uses: (1) AMRAP set — performing as many repetitions as possible with a given weight, typically used in the final set to determine proximity to failure and inform load for the next session; (2) AMRAP round — completing as many rounds of a circuit as possible within a fixed time period (common in CrossFit and HIIT). AMRAP sets are a practical form of autoregulation, directly measuring performance capacity on the day. An AMRAP set of >5 reps above the prescribed maximum indicates the load should be increased next session.",
    relatedTerms: ["rpe", "autoregulation", "volume", "hiit"],
  },

  {
    id: "pr",
    term: "Personal Record (PR)",
    category: "assessment",
    shortDefinition: "The best performance ever achieved by an individual for a specific lift or metric.",
    fullDefinition:
      "A personal record (PR), also called a personal best (PB), is the highest performance ever achieved by an individual in a specific exercise or event — typically the maximum weight lifted for a given rep count, the longest hold, or the fastest time. PRs serve as objective benchmarks of strength progress and are a key motivational driver in structured training. A PR on every session is only possible for beginners (beginner gains); intermediate and advanced athletes may set PRs monthly or less frequently. Volume PRs (most sets completed in a session) and technique PRs (qualitative improvement) complement load-based PRs.",
    relatedTerms: ["1rm", "progressive-overload", "periodisation", "strength"],
  },

  {
    id: "muscle-imbalance",
    term: "Muscle Imbalance",
    category: "assessment",
    shortDefinition: "Strength or activation disparity between opposing or synergistic muscle groups.",
    fullDefinition:
      "A condition in which opposing muscle groups (agonist vs antagonist) or bilateral counterparts (left vs right) display significant differences in strength, flexibility, or activation timing. Common patterns: upper cross syndrome (tight upper trapezius/pectorals, weak deep neck flexors/serratus anterior), lower cross syndrome (tight hip flexors/lumbar erectors, weak gluteals/deep abdominals). Muscle imbalances alter joint biomechanics, increase injury risk, and reduce performance. Assessment involves manual muscle testing, functional movement screening, and side-to-side strength ratio testing (e.g., quad-to-hamstring ratio of 0.6 is normative for knee health).",
    relatedTerms: ["kinetic-chain", "scapular-dyskinesia", "patellofemoral-pain-syndrome", "lower-cross-syndrome"],
  },

  {
    id: "warm-up",
    term: "Warm-Up",
    category: "assessment",
    shortDefinition: "Pre-exercise preparation increasing core temperature, tissue extensibility, and neuromuscular activation.",
    fullDefinition:
      "A structured pre-exercise routine designed to increase core and muscle temperature (by 1–2°C), enhance soft tissue extensibility, activate key stabiliser muscles, and mentally prepare for training. An effective warm-up includes: (1) general cardiovascular elevation (5 minutes light aerobic work); (2) dynamic mobility for the session's targeted joints; (3) muscle activation work (glutes, rotator cuff, core); (4) progressive exercise-specific ramp sets. Static stretching before strength training reduces acute force production by 5–8% — replace with dynamic mobility. The warm-up should mirror the session's primary movement patterns.",
    relatedTerms: ["protocols", "dynamic-mobility", "muscle-activation", "injury-prevention"],
  },

  {
    id: "static-stretching",
    term: "Static Stretching",
    category: "movement",
    shortDefinition: "Holding a stretch at end range for 15–60 seconds to increase tissue extensibility.",
    fullDefinition:
      "A flexibility technique involving holding a lengthened position for a sustained period (typically 20–60 seconds per repetition). Acute mechanisms include viscoelastic stress relaxation and increased stretch tolerance. Chronic mechanisms (performed ≥5 days/week for 4+ weeks) include increased fascicle length (sarcomere addition) and reduced passive stiffness. Most effective when performed post-exercise (cool-down) or in dedicated flexibility sessions. Performing static stretching immediately before strength or power training acutely reduces force output — replace with dynamic mobility pre-session and reserve static stretching for post-session or separate sessions.",
    relatedTerms: ["warm-up", "dynamic-mobility", "flexibility", "muscle-imbalance"],
  },

  {
    id: "dynamic-mobility",
    term: "Dynamic Mobility",
    category: "movement",
    shortDefinition: "Active movement through range of motion used as a warm-up tool, not a stretch hold.",
    fullDefinition:
      "Movement-based flexibility preparation involving controlled, deliberate joint excursions through an increasing arc of motion — leg swings, hip circles, thoracic rotations, arm circles, walking lunges. Unlike static stretching, dynamic mobility maintains or enhances neuromuscular readiness before training. It simultaneously warms the joint, lubricates articular cartilage, activates synergistic muscles, and rehearses movement patterns. Particularly important for restoring restricted hip flexion, thoracic rotation, and shoulder external rotation before compound lifts. World's greatest stretch and cat-cow are evidence-based warm-up mobility exercises.",
    relatedTerms: ["warm-up", "static-stretching", "protocols", "flexibility"],
  },

  {
    id: "myofascial-release",
    term: "Myofascial Release (MFR)",
    category: "movement",
    shortDefinition: "Manual or self-applied sustained pressure to fascia and soft tissue to reduce restriction.",
    fullDefinition:
      "A manual therapy technique applying sustained low-load pressure to the myofascial system — the interconnected web of muscle and fascia — to release restrictions, reduce trigger points, and restore glide between tissue planes. Self-myofascial release (SMR) uses foam rollers, massage balls, or therapy sticks. The proposed mechanism is trigger point deactivation via sustained ischaemic pressure and post-isometric relaxation, plus stimulation of Golgi tendon organs reducing muscle spindle sensitivity. Evidence supports acute improvements in ROM and DOMS reduction. Most effective when combined with stretching and strength work.",
    relatedTerms: ["foam-roller", "trigger-point", "static-stretching", "warm-up"],
  },
];

export { GlossaryTerm };
