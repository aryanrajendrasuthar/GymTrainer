export type GlossaryCategory =
  | "anatomy"
  | "physio-condition"
  | "movement"
  | "assessment";

export interface GlossaryTerm {
  id: string;
  term: string;
  category: GlossaryCategory;
  shortDefinition: string;
  fullDefinition: string;
  bodyRegion?: string;
  latinOrigin?: string;
  relatedTerms: string[];
}

export const glossaryTerms: GlossaryTerm[] = [
  // ─── Physio Conditions ─────────────────────────────────────────────────────

  {
    id: "adhesive-capsulitis",
    term: "Adhesive Capsulitis",
    category: "physio-condition",
    shortDefinition: "Frozen shoulder — progressive stiffening of the glenohumeral joint capsule.",
    fullDefinition:
      "A condition characterised by gradual-onset shoulder pain and progressive loss of both active and passive glenohumeral range of motion, caused by inflammation and fibrosis of the joint capsule. It follows three clinical phases: freezing (painful), frozen (stiff), and thawing (recovering). More common in women, those aged 40–60, and patients with diabetes or thyroid dysfunction. Full recovery can take 1–3 years.",
    bodyRegion: "shoulder",
    latinOrigin: "capsula — little box; adhaerere — to stick",
    relatedTerms: ["glenohumeral-joint", "joint-capsule", "external-rotation", "shoulder-impingement"],
  },

  {
    id: "rotator-cuff-strain",
    term: "Rotator Cuff Strain",
    category: "physio-condition",
    shortDefinition: "Partial or complete tear of one or more rotator cuff tendons.",
    fullDefinition:
      "Injury to the rotator cuff complex — comprising supraspinatus, infraspinatus, teres minor, and subscapularis — ranging from microscopic fibre disruption (Grade I) to partial-thickness tear (Grade II) and full-thickness rupture (Grade III). The supraspinatus is most commonly affected. Causes include acute trauma, repetitive overhead loading, and degenerative age-related change. Symptoms include lateral shoulder pain, weakness in elevation and external rotation, and a painful arc.",
    bodyRegion: "shoulder",
    relatedTerms: ["supraspinatus", "infraspinatus", "shoulder-impingement", "painful-arc"],
  },

  {
    id: "shoulder-impingement",
    term: "Shoulder Impingement Syndrome",
    category: "physio-condition",
    shortDefinition: "Compression of rotator cuff tendons under the coracoacromial arch during arm elevation.",
    fullDefinition:
      "A clinical syndrome in which the supraspinatus tendon, subacromial bursa, or long head of biceps are compressed between the humeral head and the coracoacromial arch during overhead movement. Internal impingement refers to posterior rotator cuff compression against the glenoid rim in overhead athletes. Primary impingement results from structural narrowing; secondary impingement is caused by rotator cuff weakness or scapular dyskinesia leading to superior humeral head migration.",
    bodyRegion: "shoulder",
    relatedTerms: ["rotator-cuff-strain", "subacromial-bursa", "scapular-dyskinesia", "painful-arc"],
  },

  {
    id: "cervical-strain",
    term: "Cervical Strain",
    category: "physio-condition",
    shortDefinition: "Musculoligamentous injury to the neck, typically from overuse or poor posture.",
    fullDefinition:
      "Injury to the soft tissue structures of the cervical spine — including muscles, tendons, ligaments, and joint capsules — without fracture or neurological deficit. Commonly caused by sustained poor posture (forward head posture), repetitive strain, or acute low-energy trauma. Presents with localised neck pain, restricted cervical range of motion, and referred pain to the upper trapezius and periscapular region. Deep cervical flexor weakness is a consistent finding.",
    bodyRegion: "cervical spine",
    relatedTerms: ["cervicogenic-headache", "deep-neck-flexors", "forward-head-posture", "upper-trapezius"],
  },

  {
    id: "cervicogenic-headache",
    term: "Cervicogenic Headache",
    category: "physio-condition",
    shortDefinition: "Headache originating from cervical spine structures, felt in the head.",
    fullDefinition:
      "A secondary headache disorder in which pain is referred from the upper cervical spine (C0–C3) and perceived in the head. The trigeminocervical nucleus mediates convergence of cervical afferents with trigeminal pain pathways, producing head pain. Typically unilateral, precipitated by neck movement or sustained posture, and accompanied by restricted cervical range of motion. Distinguished from migraine by absence of nausea/vomiting and by reproduction with cervical palpation.",
    bodyRegion: "cervical spine",
    relatedTerms: ["cervical-strain", "suboccipital-muscles", "trigeminal-nerve", "upper-cervical-spine"],
  },

  {
    id: "whiplash",
    term: "Whiplash-Associated Disorder (WAD)",
    category: "physio-condition",
    shortDefinition: "Cervical soft tissue injury from rapid acceleration-deceleration of the neck.",
    fullDefinition:
      "A clinical syndrome following cervical hyperextension-flexion injury (classically a rear-end motor vehicle collision), causing damage to muscles, ligaments, intervertebral discs, facet joints, and neural tissue. Graded I–IV by the Quebec Task Force: Grade I (pain, no physical signs), Grade II (pain with musculoskeletal signs), Grade III (neurological deficit), Grade IV (fracture/dislocation). Chronic WAD (beyond 3 months) is associated with central sensitisation, altered proprioception, and psychological factors.",
    bodyRegion: "cervical spine",
    relatedTerms: ["cervical-strain", "central-sensitisation", "facet-joint", "deep-neck-flexors"],
  },

  {
    id: "thoracic-outlet-syndrome",
    term: "Thoracic Outlet Syndrome (TOS)",
    category: "physio-condition",
    shortDefinition: "Compression of the neurovascular bundle between the clavicle and first rib.",
    fullDefinition:
      "A group of disorders caused by compression of the brachial plexus, subclavian artery, or subclavian vein in the thoracic outlet — the space between the clavicle, first rib, and anterior/middle scalene muscles. Neurogenic TOS (95% of cases) presents with medial arm/hand paraesthesia and intrinsic hand weakness. Vascular TOS produces arm pallor, cyanosis, or pulsatile swelling. Provoked by thoracic kyphosis, elevated first rib, scalene hypertrophy, or poor posture.",
    bodyRegion: "cervical and shoulder",
    relatedTerms: ["brachial-plexus", "scalene-muscles", "first-rib", "cervical-strain"],
  },

  {
    id: "thoracic-kyphosis",
    term: "Thoracic Kyphosis",
    category: "physio-condition",
    shortDefinition: "Excessive posterior curvature of the thoracic spine beyond 45 degrees.",
    fullDefinition:
      "A spinal deformity characterised by an abnormal increase in the thoracic kyphotic curve (normal: 20–45 degrees). Postural kyphosis is flexible and correctable, arising from prolonged flexed postures. Structural kyphosis (Scheuermann's disease) involves vertebral end-plate irregularities and wedging. Associated with anterior chest tightness, posterior thoracic muscle weakness, and downstream effects including shoulder impingement and cervical strain from compensatory forward head posture.",
    bodyRegion: "thoracic spine",
    latinOrigin: "kyphosis — hunchback (Greek)",
    relatedTerms: ["scapular-dyskinesia", "shoulder-impingement", "cervical-strain", "erector-spinae"],
  },

  {
    id: "scapular-winging",
    term: "Scapular Winging",
    category: "physio-condition",
    shortDefinition: "Medial border of the scapula lifts away from the thorax due to serratus anterior weakness.",
    fullDefinition:
      "A clinical sign and condition in which the medial border and inferior angle of the scapula protrude posteriorly from the chest wall, caused primarily by serratus anterior weakness or long thoracic nerve palsy. Winging becomes pronounced during shoulder flexion and push-up movements. Secondary winging can occur from trapezius weakness (affecting the spinal accessory nerve) or rhomboid over-dominance. Compromises glenohumeral biomechanics, increases rotator cuff impingement risk, and reduces upper limb force transmission.",
    bodyRegion: "thoracic and shoulder",
    relatedTerms: ["serratus-anterior", "long-thoracic-nerve", "scapular-dyskinesia", "shoulder-impingement"],
  },

  {
    id: "scapular-dyskinesia",
    term: "Scapular Dyskinesia",
    category: "physio-condition",
    shortDefinition: "Altered scapular movement patterns compromising shoulder mechanics.",
    fullDefinition:
      "An observable alteration in scapular position and motion patterns, classified by the Kibler system: Type I (inferior angle prominence), Type II (medial border prominence), Type III (superior translation). Caused by muscle imbalances between serratus anterior, lower trapezius, upper trapezius, and rhomboids. Disrupts the normal scapulohumeral rhythm, reducing subacromial space during elevation and increasing rotator cuff impingement and instability risk. Commonly found in overhead athletes and desk workers.",
    bodyRegion: "shoulder",
    relatedTerms: ["scapular-winging", "serratus-anterior", "lower-trapezius", "shoulder-impingement"],
  },

  {
    id: "l4-l5-disc-herniation",
    term: "L4-L5 Disc Herniation",
    category: "physio-condition",
    shortDefinition: "Protrusion of the L4-L5 intervertebral disc compressing the L5 nerve root.",
    fullDefinition:
      "Displacement of nucleus pulposus material through the annulus fibrosus at the L4-L5 level, typically in a postero-lateral direction into the spinal canal or intervertebral foramen. Compression of the L5 nerve root produces pain in the posterior lateral thigh, lateral calf, dorsum of the foot, and first web space, with weakness of big toe extension (extensor hallucis longus) and foot dorsiflexion. Aggravated by lumbar flexion, prolonged sitting, and Valsalva manoeuvre. McKenzie extension therapy is the primary conservative intervention.",
    bodyRegion: "lumbar spine",
    relatedTerms: ["l5-s1-disc-herniation", "nerve-root", "mckenzie-method", "centralisation"],
  },

  {
    id: "l5-s1-disc-herniation",
    term: "L5-S1 Disc Herniation",
    category: "physio-condition",
    shortDefinition: "Protrusion of the L5-S1 intervertebral disc compressing the S1 nerve root.",
    fullDefinition:
      "Displacement of nucleus pulposus through the annulus fibrosus at the lumbosacral junction (L5-S1), compressing the S1 nerve root. S1 radiculopathy presents with pain in the posterior thigh, calf, and lateral or plantar foot, with weakness of plantar flexion (gastrocnemius-soleus) and a depressed Achilles reflex. The most common level for lumbar disc herniation. Aggravated by sitting, forward bending, and Valsalva. Conservative management has a 90% recovery rate within 12 weeks.",
    bodyRegion: "lumbar spine",
    relatedTerms: ["l4-l5-disc-herniation", "s1-nerve-root", "centralisation", "achilles-reflex"],
  },

  {
    id: "coccydynia",
    term: "Coccydynia",
    category: "physio-condition",
    shortDefinition: "Chronic pain at the coccyx (tailbone), aggravated by sitting.",
    fullDefinition:
      "Pain localised to the coccyx or sacrococcygeal region, exacerbated by prolonged sitting, transitioning from sitting to standing, and defecation. Caused by direct trauma (fall onto the tailbone), childbirth-related injury, repetitive microtrauma (cyclists, rowers), or hypermobility/instability of the sacrococcygeal joint. Pelvic floor hypertonicity is a common associated finding. Management includes postural modification, pelvic floor relaxation, corticosteroid injection, and occasionally internal manual mobilisation by a pelvic physiotherapist.",
    bodyRegion: "sacrococcygeal",
    latinOrigin: "kokkyx — cuckoo (Greek, for the beak-like shape of the coccyx)",
    relatedTerms: ["pelvic-floor", "sacrococcygeal-joint", "piriformis-syndrome"],
  },

  {
    id: "patellofemoral-pain-syndrome",
    term: "Patellofemoral Pain Syndrome (PFPS)",
    category: "physio-condition",
    shortDefinition: "Anterior knee pain arising from altered patella tracking on the femoral trochlea.",
    fullDefinition:
      "A clinical syndrome characterised by anterior or peripatellar pain worsened by activities that load the patellofemoral joint (squatting, stairs, prolonged sitting). Caused by lateral patella maltracking resulting from VMO-to-VL muscle imbalance, tight lateral retinaculum, hip abductor weakness producing dynamic valgus, or foot pronation. Retropatellar cartilage stress is not always the primary pathology — pain is now thought to arise from subchondral bone, synovium, and infrapatellar fat pad. Conservative rehabilitation targeting VMO strengthening and hip abductor correction resolves 80% of cases.",
    bodyRegion: "knee",
    relatedTerms: ["vmo", "dynamic-valgus", "hip-abductors", "it-band-syndrome"],
  },

  {
    id: "it-band-syndrome",
    term: "Iliotibial Band Syndrome (ITBS)",
    category: "physio-condition",
    shortDefinition: "Lateral knee pain from ITB compression over the lateral femoral epicondyle.",
    fullDefinition:
      "An overuse condition causing pain at the lateral knee (2–3 cm proximal to the lateral joint line) due to repetitive compression of a highly innervated layer of fat and connective tissue beneath the distal ITB. Previously attributed to ITB friction; current evidence supports a fat-pad impingement model. Common in runners and cyclists. Contributing factors include hip abductor weakness (gluteus medius), excessive hip adduction during loading, rearfoot overpronation, sudden training load increase, and downhill running.",
    bodyRegion: "knee and hip",
    relatedTerms: ["tfl", "gluteus-medius", "hip-abductors", "patellofemoral-pain-syndrome"],
  },

  {
    id: "achilles-tendinopathy",
    term: "Achilles Tendinopathy",
    category: "physio-condition",
    shortDefinition: "Degenerative Achilles tendon condition causing posterior heel pain with loading.",
    fullDefinition:
      "A clinical diagnosis characterised by localised Achilles tendon pain (mid-portion or insertional), morning stiffness, and load-related pain, with histopathological features of failed healing: increased tenocyte density, neovascularisation, and disorganised collagen (tendinosis). Distinct from acute tendinitis (inflammatory). Mid-portion tendinopathy (2–6 cm above insertion) responds to eccentric loading (Alfredson protocol) and heavy slow resistance training. Insertional tendinopathy requires avoidance of end-range dorsiflexion. Fluoroquinolone antibiotics are a recognised pharmacological risk factor.",
    bodyRegion: "ankle",
    latinOrigin: "tendo Achillis — tendon of Achilles",
    relatedTerms: ["eccentric-loading", "tendinosis", "plantar-fasciitis", "heavy-slow-resistance"],
  },

  {
    id: "plantar-fasciitis",
    term: "Plantar Fasciitis",
    category: "physio-condition",
    shortDefinition: "Degenerative enthesopathy at the plantar fascia's calcaneal insertion causing heel pain.",
    fullDefinition:
      "The most common cause of inferior heel pain, arising from degenerative changes at the origin of the plantar fascia at the medial calcaneal tuberosity. Contrary to its name, acute inflammation is rarely the primary pathology; repetitive tensile overload produces a failed healing response (fasciosis). Classic presentation: worst pain with first steps in the morning, improving with walking, worsening again after prolonged activity. Risk factors include limited ankle dorsiflexion, tight calf complex, high BMI, prolonged standing, and sudden training load increases.",
    bodyRegion: "foot",
    latinOrigin: "fascia plantaris — sole covering; calcaneus — heel bone",
    relatedTerms: ["achilles-tendinopathy", "intrinsic-foot-muscles", "dorsiflexion", "calcaneus"],
  },

  {
    id: "peroneal-tendon-injury",
    term: "Peroneal Tendon Injury",
    category: "physio-condition",
    shortDefinition: "Tendinopathy, tear, or subluxation of the peroneal tendons behind the lateral malleolus.",
    fullDefinition:
      "Injuries to the peroneus longus and brevis tendons as they course behind the lateral malleolus within the peroneal groove. Includes tendinopathy (overuse degeneration), longitudinal splits (peroneus brevis most common), and subluxation/dislocation beyond the fibula (from superior peroneal retinaculum rupture). Presents with lateral ankle pain, swelling, and instability, often following ankle sprains or recurrent inversion trauma. Peroneal muscles are the primary everters and dynamic lateral ankle stabilisers — weakness increases inversion sprain recurrence risk.",
    bodyRegion: "ankle",
    relatedTerms: ["peroneals", "lateral-malleolus", "ankle-instability", "achilles-tendinopathy"],
  },

  {
    id: "piriformis-syndrome",
    term: "Piriformis Syndrome",
    category: "physio-condition",
    shortDefinition: "Sciatic nerve irritation caused by piriformis muscle hypertrophy or spasm.",
    fullDefinition:
      "A controversial neuromuscular condition in which the piriformis muscle — a deep external hip rotator crossing the greater sciatic foramen — compresses or irritates the sciatic nerve. In approximately 15% of the population, the sciatic nerve pierces through the piriformis, increasing vulnerability. Presents with deep gluteal pain, tenderness on palpation of the piriformis, pain with prolonged sitting, and reproduction of symptoms with hip internal rotation and adduction (FAIR test). Distinguished from true lumbar radiculopathy by normal lumbar imaging and absence of neurological deficit.",
    bodyRegion: "hip",
    relatedTerms: ["sciatic-nerve", "deep-gluteal-syndrome", "l5-s1-disc-herniation", "si-joint-dysfunction"],
  },

  {
    id: "si-joint-dysfunction",
    term: "Sacroiliac Joint Dysfunction",
    category: "physio-condition",
    shortDefinition: "Pain arising from the SI joint due to altered movement or load transfer.",
    fullDefinition:
      "A clinical condition producing posterior pelvic pain (typically unilateral, below L5, over the PSIS) arising from either hypermobility (ligamentous laxity, commonly postpartum) or hypomobility (degenerative) of the sacroiliac joint. The SI joint transfers load between the lumbar spine and lower limb via form closure (bony geometry) and force closure (muscular compression). Diagnosis requires provocation testing (Thigh Thrust, FABER, Gaenslen). Rehabilitation focuses on force-closure muscles: gluteus maximus, gluteus medius, biceps femoris, and thoracolumbar fascia tensioners.",
    bodyRegion: "pelvis",
    relatedTerms: ["piriformis-syndrome", "sacrum", "ilium", "gluteus-maximus", "coccydynia"],
  },

  // ─── Anatomy ───────────────────────────────────────────────────────────────

  {
    id: "erector-spinae",
    term: "Erector Spinae",
    category: "anatomy",
    shortDefinition: "Column of muscles running along the length of the spine, extending and stabilising it.",
    fullDefinition:
      "A group of three paired muscles — iliocostalis, longissimus, and spinalis — that run bilaterally from the sacrum and iliac crest to the skull. They are the primary spinal extensors and maintain upright posture against gravity. The lower fibres (iliocostalis lumborum, longissimus thoracis) are particularly active in lumbar extension and are vulnerable to fatigue-related strain. Distinguished from the multifidus, which provides intersegmental stability at deeper levels.",
    bodyRegion: "spine",
    latinOrigin: "erector — one who erects; spina — thorn/spine",
    relatedTerms: ["multifidus", "thoracic-kyphosis", "l4-l5-disc-herniation", "lumbar-spine"],
  },

  {
    id: "multifidus",
    term: "Multifidus",
    category: "anatomy",
    shortDefinition: "Deep spinal stabiliser providing intersegmental control of the lumbar vertebrae.",
    fullDefinition:
      "The deepest layer of the erector spinae group, comprising short fascicles that span 2–4 vertebral segments. The multifidus accounts for approximately 60–80% of lumbar segmental stiffness and is the primary stabiliser of the lumbar spine under load. It undergoes rapid, selective atrophy ipsilateral to a disc herniation or nerve root compression — often within 24 hours — and does not spontaneously recover without targeted rehabilitation. Tonic (slow-twitch) fibre-dominant; best rehabilitated with low-load sustained contractions (prone heel squeeze, bird-dog).",
    bodyRegion: "lumbar spine",
    latinOrigin: "multus — many; findere — to split",
    relatedTerms: ["erector-spinae", "transversus-abdominis", "l4-l5-disc-herniation", "bird-dog"],
  },

  {
    id: "transversus-abdominis",
    term: "Transversus Abdominis (TrA)",
    category: "anatomy",
    shortDefinition: "Deepest abdominal muscle — the primary spinal stabiliser of the core.",
    fullDefinition:
      "The innermost abdominal muscle, with fibres running transversely between the thoracolumbar fascia, costal cartilages, inguinal ligament, and iliac crest. It increases intra-abdominal pressure and tensions the thoracolumbar fascia, compressing the lumbar spine to increase segmental stiffness. In healthy individuals TrA pre-activates 30–100 ms before limb movement; in chronic low back pain this anticipatory activation is delayed. Rehabilitated via low-load drawing-in manoeuvres and progressed through dead-bug and bird-dog patterns.",
    bodyRegion: "core",
    latinOrigin: "transversus — across; abdomen — belly",
    relatedTerms: ["multifidus", "erector-spinae", "dead-bug", "intra-abdominal-pressure"],
  },

  {
    id: "serratus-anterior",
    term: "Serratus Anterior",
    category: "anatomy",
    shortDefinition: "Scapular protractor that holds the medial border against the thorax and upwardly rotates the scapula.",
    fullDefinition:
      "A broad, fan-shaped muscle arising from the lateral surfaces of ribs 1–8 and inserting on the costal surface of the medial scapular border. Its primary actions are scapular protraction and upward rotation — essential for full shoulder elevation. It works in force-couple with the upper and lower trapezius to maintain scapulohumeral rhythm. Weakness (from long thoracic nerve palsy or inhibition) produces scapular winging. The lower fibres are preferentially activated during the push-up plus exercise. Highly susceptible to inhibition from shoulder pain.",
    bodyRegion: "shoulder",
    latinOrigin: "serratus — saw-toothed (describing the serrated origin)",
    relatedTerms: ["scapular-winging", "scapular-dyskinesia", "lower-trapezius", "long-thoracic-nerve"],
  },

  {
    id: "gluteus-medius",
    term: "Gluteus Medius",
    category: "anatomy",
    shortDefinition: "Primary hip abductor and frontal-plane pelvic stabiliser during single-leg stance.",
    fullDefinition:
      "A fan-shaped muscle on the outer ilium between the iliac crest and greater trochanter. Its primary action is hip abduction; during single-leg stance it prevents contralateral pelvic drop (Trendelenburg sign). The anterior fibres assist with internal rotation and flexion; the posterior fibres contribute to external rotation and extension. Weakness is a key biomechanical driver of PFPS, ITBS, low back pain, and hip osteoarthritis. Targeted with side-lying hip abduction, clamshell, and single-leg squat exercises.",
    bodyRegion: "hip",
    latinOrigin: "gluteus — buttock; medius — middle",
    relatedTerms: ["gluteus-maximus", "gluteus-minimus", "patellofemoral-pain-syndrome", "it-band-syndrome", "trendelenburg-sign"],
  },

  {
    id: "piriformis",
    term: "Piriformis",
    category: "anatomy",
    shortDefinition: "Deep external hip rotator traversing the greater sciatic foramen, adjacent to the sciatic nerve.",
    fullDefinition:
      "A flat, pear-shaped muscle originating from the anterior sacrum (S2–S4) and inserting on the superior aspect of the greater trochanter. It is the primary external hip rotator when the hip is in neutral extension, but becomes an abductor and internal rotator when the hip is flexed beyond 90 degrees. It exits the pelvis via the greater sciatic foramen, where it lies directly over or adjacent to the sciatic nerve. Spasm or hypertrophy can compress the sciatic nerve (piriformis syndrome). Located deep to gluteus maximus.",
    bodyRegion: "hip",
    latinOrigin: "pirum — pear; forma — shape",
    relatedTerms: ["piriformis-syndrome", "sciatic-nerve", "gluteus-maximus", "si-joint-dysfunction"],
  },

  {
    id: "gastrocnemius",
    term: "Gastrocnemius",
    category: "anatomy",
    shortDefinition: "Two-headed calf muscle producing plantar flexion at the ankle and knee flexion.",
    fullDefinition:
      "The superficial biarticular calf muscle with medial and lateral heads originating from the femoral condyles and inserting into the posterior calcaneus via the Achilles tendon. It is a powerful plantar flexor and contributes to knee flexion. Because it crosses the knee, it is optimally stretched with the knee extended. Composed predominantly of Type II (fast-twitch) fibres. It is the primary propulsive force in running and jumping and is the muscle targeted in the straight-knee phase of the Alfredson eccentric protocol for Achilles tendinopathy.",
    bodyRegion: "lower leg",
    latinOrigin: "gaster — belly/stomach; kneme — leg (Greek)",
    relatedTerms: ["soleus", "achilles-tendinopathy", "plantar-fasciitis", "eccentric-loading"],
  },

  {
    id: "soleus",
    term: "Soleus",
    category: "anatomy",
    shortDefinition: "Deep postural calf muscle producing plantar flexion; does not cross the knee.",
    fullDefinition:
      "A broad, flat monoarticular muscle beneath the gastrocnemius, originating from the posterior tibia and fibula and inserting via the Achilles tendon onto the calcaneus. Unlike the gastrocnemius, it is active during standing and walking regardless of knee position. Composed predominantly of Type I (slow-twitch, fatigue-resistant) fibres — one of the highest proportions in the human body. Targeted specifically with bent-knee calf raises and the bent-knee phase of the Alfredson eccentric protocol. Tight soleus is directly linked to limited ankle dorsiflexion and plantar fasciitis.",
    bodyRegion: "lower leg",
    latinOrigin: "solea — sandal (flat fish-like shape)",
    relatedTerms: ["gastrocnemius", "achilles-tendinopathy", "plantar-fasciitis", "dorsiflexion"],
  },

  {
    id: "peroneals",
    term: "Peroneals (Fibularis Muscles)",
    category: "anatomy",
    shortDefinition: "Lateral compartment muscles of the lower leg producing ankle eversion and stabilisation.",
    fullDefinition:
      "The peroneal (fibularis) muscles — longus and brevis — run along the lateral fibula and pass posterior to the lateral malleolus in a common synovial sheath before inserting on the foot. Peroneus longus traverses the plantar foot to insert on the medial cuneiform and first metatarsal, supporting the transverse arch. Peroneus brevis inserts on the fifth metatarsal base. Both muscles evert the ankle and are the primary dynamic stabilisers against inversion sprain. Proprioceptive re-training is essential after lateral ankle injury because peroneal reaction time is delayed by 30–40 ms post-sprain.",
    bodyRegion: "lower leg",
    latinOrigin: "perone — brooch/fibula (Greek)",
    relatedTerms: ["peroneal-tendon-injury", "ankle-instability", "lateral-malleolus", "inversion"],
  },

  {
    id: "quadriceps-vmo",
    term: "Vastus Medialis Oblique (VMO)",
    category: "anatomy",
    shortDefinition: "Medial quad muscle providing medial patella stabilisation in the last 30° of extension.",
    fullDefinition:
      "The distal fibres of vastus medialis, running at 50–55 degrees to the femoral shaft and inserting on the medial patella border. Its primary function is medial patellar stabilisation, opposing the lateral pull of vastus lateralis and the lateral retinaculum. VMO-to-VL muscle ratio imbalance is a key mechanism in PFPS, with VMO often inhibited by pain-related arthrogenic inhibition. Maximally activated in the last 30 degrees of knee extension and during terminal knee extension exercises. Cannot be isolated from vastus medialis but can be preferentially loaded through hip external rotation and targeted terminal extension work.",
    bodyRegion: "knee",
    latinOrigin: "vastus — vast/large; medialis — medial; obliquus — oblique",
    relatedTerms: ["patellofemoral-pain-syndrome", "vmo-terminal-knee-extension", "patellar-tracking"],
  },

  // ─── Movement Terms ────────────────────────────────────────────────────────

  {
    id: "dorsiflexion",
    term: "Dorsiflexion",
    category: "movement",
    shortDefinition: "Upward movement of the foot toward the shin at the ankle joint.",
    fullDefinition:
      "Sagittal plane ankle movement in which the dorsum (top) of the foot moves toward the anterior tibia, reducing the angle between the foot and leg. Normal ROM is 10–20 degrees weight-bearing. Limited dorsiflexion (<10 degrees) forces compensatory hyperpronation, forefoot abduction, or early heel rise during gait, contributing to plantar fasciitis, Achilles tendinopathy, and patellofemoral pain. Dorsiflexion ROM is primarily limited by gastrocnemius and soleus tightness or posterior ankle joint capsule restriction.",
    bodyRegion: "ankle",
    latinOrigin: "dorsum — back; flectere — to bend",
    relatedTerms: ["plantar-fasciitis", "achilles-tendinopathy", "soleus", "gastrocnemius"],
  },

  {
    id: "centralisation",
    term: "Centralisation",
    category: "movement",
    shortDefinition: "Movement of referred limb pain back toward the spine in response to directional loading.",
    fullDefinition:
      "A clinical phenomenon in McKenzie Mechanical Diagnosis and Therapy (MDT) in which distal referred pain (e.g., into the leg from a lumbar disc herniation) progressively moves proximally toward the spine in response to repeated end-range movements — typically lumbar extension for disc herniations. Centralisation predicts a favourable outcome and guides directional preference treatment. Its opposite — peripheralisation (pain moving further into the limb) — indicates that the direction of loading is worsening disc position and should be discontinued. The underlying mechanism is thought to be nuclear reduction of the disc herniation.",
    bodyRegion: "lumbar spine",
    relatedTerms: ["l4-l5-disc-herniation", "l5-s1-disc-herniation", "mckenzie-method", "peripheralisation"],
  },

  {
    id: "scapulohumeral-rhythm",
    term: "Scapulohumeral Rhythm",
    category: "movement",
    shortDefinition: "The coordinated 2:1 ratio of glenohumeral to scapulothoracic movement during arm elevation.",
    fullDefinition:
      "The coupled movement pattern between the glenohumeral joint and the scapula during shoulder abduction and flexion. For every 3 degrees of total shoulder elevation, approximately 2 degrees occur at the glenohumeral joint and 1 degree occurs as scapular upward rotation on the thorax (2:1 ratio). This rhythm maintains the glenoid facing the humeral head throughout the arc, maximising rotator cuff muscle length-tension and preserving the subacromial space. Disruption by serratus anterior or lower trapezius weakness (scapular dyskinesia) increases impingement risk during overhead movement.",
    bodyRegion: "shoulder",
    relatedTerms: ["scapular-dyskinesia", "serratus-anterior", "shoulder-impingement", "glenohumeral-joint"],
  },

  {
    id: "force-closure",
    term: "Force Closure",
    category: "movement",
    shortDefinition: "Muscular compression that stabilises the SI joint when form closure alone is insufficient.",
    fullDefinition:
      "One of two mechanisms stabilising the sacroiliac joint, described by Vleeming et al. Force closure refers to the compressive force generated by muscles and ligaments that dynamically tighten the SI joint, supplementing the passive bony congruence (form closure). Key force-closure muscles include gluteus maximus (via the thoracolumbar fascia), biceps femoris, and gluteus medius. Failure of force closure due to muscle weakness or motor control deficits is the primary rehabilitation target in SI joint dysfunction. The SI joint compression belt mimics force closure externally.",
    bodyRegion: "pelvis",
    relatedTerms: ["si-joint-dysfunction", "gluteus-maximus", "thoracolumbar-fascia", "form-closure"],
  },

  {
    id: "neural-tension",
    term: "Neural Tension / Neurodynamics",
    category: "movement",
    shortDefinition: "The mechanical sensitivity and mobility of the peripheral nervous system under stretch.",
    fullDefinition:
      "The biomechanical and physiological properties governing neural tissue movement and deformation relative to surrounding structures. In a healthy state, nerves slide, elongate, and cross-pressure gradients as the body moves. When nerves are sensitised (by compression, ischaemia, or chemical irritation), normal mechanical loads provoke abnormal responses — pain, paraesthesia, or muscle guarding. Neurodynamic tests (SLR, slump, upper limb tension tests) reproduce symptoms by loading neural structures. Neural flossing (oscillatory mobilisation) reduces mechanosensitivity; neural tensioning (sustained stretch) recruits different neural pathways and should be used selectively.",
    bodyRegion: "general",
    relatedTerms: ["sciatic-nerve", "brachial-plexus", "l4-l5-disc-herniation", "thoracic-outlet-syndrome"],
  },

  {
    id: "tendinopathy-continuum",
    term: "Tendinopathy Continuum",
    category: "assessment",
    shortDefinition: "A three-stage model of tendon pathology from reactive to degenerative tendinopathy.",
    fullDefinition:
      "Cook and Purdam's (2009) model describing tendon pathology as a continuum: (1) Reactive tendinopathy — acute, non-inflammatory proliferative response to overload; reversible with load reduction; (2) Tendon disrepair — failed healing with increased ground substance and vascular ingrowth; partially reversible; (3) Degenerative tendinopathy — cell death, matrix disruption, and neovascularisation; difficult to reverse. Clinical implications: reactive tendons require load reduction; degenerative tendons require progressive loading to stimulate collagen remodelling. The VISA scoring tool quantifies tendinopathy severity and monitors progress.",
    bodyRegion: "general",
    relatedTerms: ["achilles-tendinopathy", "plantar-fasciitis", "peroneal-tendon-injury", "rotator-cuff-strain"],
  },

  // ─── Assessment Terms ──────────────────────────────────────────────────────

  {
    id: "rom",
    term: "Range of Motion (ROM)",
    category: "assessment",
    shortDefinition: "The arc through which a joint can move, measured in degrees.",
    fullDefinition:
      "The total arc of movement available at a joint, measured in degrees using a goniometer or inclinometer. Active ROM (AROM) is achieved by the patient using their own muscles; passive ROM (PROM) is produced by an external force with the patient relaxed. Resistive ROM testing identifies contractile tissue pathology. ROM deficits guide physiotherapy intervention: joint restriction responds to mobilisation and manipulation; muscular restriction responds to stretching and strengthening; neural restriction responds to neurodynamic techniques.",
    bodyRegion: "general",
    relatedTerms: ["arom", "prom", "goniometer", "joint-mobilisation"],
  },

  {
    id: "radiculopathy",
    term: "Radiculopathy",
    category: "assessment",
    shortDefinition: "Neurological dysfunction from compression or irritation of a spinal nerve root.",
    fullDefinition:
      "A clinical syndrome resulting from impairment of a spinal nerve root, characterised by a dermatomal pattern of pain, paraesthesia, or numbness and a myotomal pattern of motor weakness, with or without reflex change. Distinguished from radicular pain (pain alone in a dermatomal distribution) and referred pain (somatic, non-dermatomal). Common causes include disc herniation, foraminal stenosis, and facet joint hypertrophy. Neurological examination (sensation testing, motor power, reflexes) maps the affected level. Electrodiagnostic studies (EMG/NCS) confirm the diagnosis when clinical findings are ambiguous.",
    bodyRegion: "spine",
    latinOrigin: "radix — root; -pathy — suffering",
    relatedTerms: ["l4-l5-disc-herniation", "l5-s1-disc-herniation", "neural-tension", "dermatome"],
  },

  {
    id: "central-sensitisation",
    term: "Central Sensitisation",
    category: "assessment",
    shortDefinition: "Amplified pain processing in the central nervous system, causing allodynia and hyperalgesia.",
    fullDefinition:
      "A state of increased neuronal excitability in the spinal cord and brain resulting in amplified pain responses, lowered pain thresholds, and expanded pain areas beyond the site of original injury. Characterised by allodynia (pain from normally non-painful stimuli), hyperalgesia (exaggerated pain from mildly painful stimuli), and temporal summation (wind-up). Central sensitisation is a key feature of chronic WAD, fibromyalgia, and persistent non-specific low back pain. Treatment requires pain neuroscience education, graded activity/exposure, and psychological coping strategies rather than tissue-based interventions alone.",
    bodyRegion: "general",
    relatedTerms: ["whiplash", "chronic-pain", "pain-neuroscience-education", "graded-exposure"],
  },

  {
    id: "kinetic-chain",
    term: "Kinetic Chain",
    category: "assessment",
    shortDefinition: "The interdependence of linked body segments during movement, where dysfunction at one joint affects others.",
    fullDefinition:
      "A concept in biomechanics describing how the body segments — foot, ankle, knee, hip, pelvis, and spine — function as an integrated system during movement. In a closed kinetic chain (foot on the ground), forces and motions propagate sequentially through each joint. In an open kinetic chain (foot free), the distal segment moves independently. Dysfunction at one link (e.g., ankle hypomobility) creates compensatory loading at adjacent joints (e.g., knee valgus, hip adduction). Understanding the kinetic chain explains why PFPS, ITBS, and low back pain often coexist and why treating remote joints is often as important as treating the symptomatic site.",
    bodyRegion: "general",
    relatedTerms: ["patellofemoral-pain-syndrome", "it-band-syndrome", "dorsiflexion", "dynamic-valgus"],
  },
];

export const glossaryMap: Record<string, GlossaryTerm> = Object.fromEntries(
  glossaryTerms.map((t) => [t.id, t])
);

export function getTermById(id: string): GlossaryTerm | undefined {
  return glossaryMap[id];
}

export function getTermsByCategory(category: GlossaryCategory): GlossaryTerm[] {
  return glossaryTerms.filter((t) => t.category === category);
}

export function getTermsByBodyRegion(region: string): GlossaryTerm[] {
  return glossaryTerms.filter(
    (t) => t.bodyRegion?.toLowerCase().includes(region.toLowerCase())
  );
}

export function searchGlossary(query: string): GlossaryTerm[] {
  const q = query.toLowerCase();
  return glossaryTerms.filter(
    (t) =>
      t.term.toLowerCase().includes(q) ||
      t.shortDefinition.toLowerCase().includes(q) ||
      t.relatedTerms.some((r) => r.toLowerCase().includes(q))
  );
}
