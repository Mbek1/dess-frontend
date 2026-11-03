<!-- Removed duplicate template block -->
<template>
  <div>
    <!-- Header -->
    <header id="header" class="header d-flex align-items-center fixed-top">
      <div class="container-fluid container-xl position-relative d-flex align-items-center justify-content-between">
        <a href="index.html" class="logo d-flex align-items-center">
          <h1 class="sitename">DESS</h1>
        </a>
        <nav id="navmenu" class="navmenu">
          <ul>
            <li><a href="#hero" class="active">Home</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#features">Features</a></li>
            <li class="dropdown"><a href="#"><span>Career Paths</span> <i class="bi bi-chevron-down toggle-dropdown"></i></a>
              <ul>
                <li><a href="https://www.sans.org/cyber-security-courses/advanced-incident-response-threat-hunting-training/" target="_blank">Digital Forensics Investigator</a></li>
                <li><a href="https://www.coursera.org/professional-certificates/google-cybersecurity" target="_blank">Cybersecurity Analyst</a></li>
                <li><a href="https://www.eccouncil.org/train-certify/certified-incident-handler-ecih/" target="_blank">Incident Response Specialist</a></li>
                <li><a href="https://www.sans.org/cyber-security-courses/reverse-engineering-malware-malware-analysis-tools-techniques/" target="_blank">Malware Analyst</a></li>
                <li class="dropdown"><a href="#"><span>Specialized Courses</span> <i class="bi bi-chevron-down toggle-dropdown"></i></a>
                  <ul>
                    <li><a href="https://www.sans.org/cyber-security-courses/advanced-smartphone-mobile-device-forensics/" target="_blank">Mobile Device Forensics</a></li>
                    <li><a href="https://www.sans.org/cyber-security-courses/network-forensics/" target="_blank">Network Forensics</a></li>
                    <li><a href="https://www.udemy.com/course/cloud-forensics/" target="_blank">Cloud Forensics</a></li>
                    <li><a href="https://www.memoryanalysis.net/memory-forensics-training" target="_blank">Memory Analysis</a></li>
                    <li><a href="https://www.infosecinstitute.com/courses/computer-forensics-boot-camp/" target="_blank">Cryptography & Data Recovery</a></li>
                  </ul>
                </li>
                <li><a href="https://iacis.com/certification-2/" target="_blank">Evidence Handling Certification</a></li>
                <li><a href="https://www.evidencemanagement.com/training/" target="_blank">Chain of Custody Training</a></li>
              </ul>
            </li>
            <li><a href="#contact">Contact</a></li>
          </ul>
          <i class="mobile-nav-toggle d-xl-none bi bi-list"></i>
        </nav>
      </div>
    </header>

    <!-- Hero Section -->
    <section id="hero" class="hero section py-5 bg-dark text-white">
      <div class="container">
        <div class="row align-items-center">
          <div class="col-lg-6">
            <h1 class="display-4 fw-bold">Digital Evidence <span class="text-success">Storage System</span></h1>
            <p class="lead">A secure platform designed to store, manage, and access digital evidence for investigative purposes.</p>
            <div class="d-flex gap-3 mt-4">
            </div>
            <div class="d-flex gap-3 mt-3">
              <button class="btn btn-success btn-lg" @click="showAuth = true">Get Started</button>
              
            </div>
  <!-- Scroll Top -->
  <a href="#" id="scroll-top" class="scroll-top d-flex align-items-center justify-content-center"><i class="bi bi-arrow-up-short"></i></a>
          </div>
          <div class="col-lg-6 text-center">
            <img src="/img/hero-img.png" class="img-fluid animated" alt="Hero" style="max-height: 320px;" />
          </div>
        </div>
      </div>
  <LoginModal v-if="showAuth" @close="showAuth = false" />
    </section>

    <!-- About Section -->
    <section id="about" class="about section py-5 bg-white">
      <div class="container">
        <div class="row align-items-center">
          <div class="col-xl-5 mb-4 mb-xl-0">
            <h3>About DESS</h3>
            <h2>Why Choose Our System?</h2>
            <p>The Digital Evidence Storage System (DESS) ensures the integrity, confidentiality, and accessibility of digital evidence while maintaining strict access control and audit logs.</p>
            <a href="#features" class="btn btn-link text-success">Explore Features <i class="bi bi-arrow-right"></i></a>
          </div>
          <div class="col-xl-7">
            <div class="row g-4">
              <div class="col-md-6">
                <div class="p-3 border rounded-3 h-100">
                  <i class="bi bi-shield-lock fs-2 text-success"></i>
                  <h5 class="mt-2">Secure & Tamper-Proof</h5>
                  <p class="mb-0">Advanced cryptographic techniques ensure data integrity with role-based access control and multi-factor authentication.</p>
                </div>
              </div>
              <div class="col-md-6">
                <div class="p-3 border rounded-3 h-100">
                  <i class="bi bi-folder-check fs-2 text-success"></i>
                  <h5 class="mt-2">Case Management</h5>
                  <p class="mb-0">Organize digital evidence files under specific cases and enable multiple investigators to collaborate effectively.</p>
                </div>
              </div>
              <div class="col-md-6">
                <div class="p-3 border rounded-3 h-100">
                  <i class="bi bi-clock-history fs-2 text-success"></i>
                  <h5 class="mt-2">Audit Trail</h5>
                  <p class="mb-0">Comprehensive logs of all activities with time-stamped records for legal and forensic purposes.</p>
                </div>
              </div>
              <div class="col-md-6">
                <div class="p-3 border rounded-3 h-100">
                  <i class="bi bi-database-check fs-2 text-success"></i>
                  <h5 class="mt-2">Data Redundancy</h5>
                  <p class="mb-0">Secure backup solutions and reliable data recovery mechanisms to prevent evidence loss.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="features section py-5 bg-light">
      <div class="container">
        <div class="row g-4">
          <div class="col-md-3 col-6" v-for="feature in features" :key="feature.title">
            <div class="text-center p-3 border rounded-3 h-100">
              <i :class="feature.icon + ' fs-1 text-success'"></i>
              <h6 class="mt-2">{{ feature.title }}</h6>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Stats Section -->
    <section id="stats" class="stats section py-5 bg-white">
      <div class="container">
        <div class="row g-4 text-center">
          <div class="col-md-3 col-6" v-for="stat in stats" :key="stat.label">
            <i :class="stat.icon + ' fs-1 text-success'"></i>
            <div class="fs-2 fw-bold">{{ stat.value }}</div>
            <div class="text-muted">{{ stat.label }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Details Section -->
    <section id="details" class="details section py-5 bg-light">
      <div class="container">
        <h2 class="mb-4">How It Works</h2>
        <div class="row g-4">
          <div class="col-md-4" v-for="detail in details" :key="detail.title">
            <div class="p-3 border rounded-3 h-100">
              <img :src="detail.img" class="img-fluid mb-3" alt="" />
              <h5>{{ detail.title }}</h5>
              <ul class="list-unstyled">
                <li v-for="item in detail.items" :key="item"><i class="bi bi-check text-success me-2"></i>{{ item }}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ Section -->
    <section id="faq" class="faq section py-5 bg-white">
      <div class="container">
        <h3 class="mb-4">Frequently Asked Questions</h3>
        <div class="accordion" id="faqAccordion">
          <div class="accordion-item" v-for="(faq, idx) in faqs" :key="faq.q">
            <h2 class="accordion-header" :id="'heading' + idx">
              <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" :data-bs-target="'#collapse' + idx" aria-expanded="false" :aria-controls="'collapse' + idx">
                <i class="bi bi-question-circle me-2"></i>{{ faq.q }}
              </button>
            </h2>
            <div :id="'collapse' + idx" class="accordion-collapse collapse" :aria-labelledby="'heading' + idx" data-bs-parent="#faqAccordion">
              <div class="accordion-body">{{ faq.a }}</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Contact Section -->
    <section id="contact" class="contact section py-5 bg-light">
      <div class="container">
        <h2 class="mb-4">Contact</h2>
        <form class="row g-3">
          <div class="col-md-6">
            <input type="text" class="form-control" placeholder="Your Name" required />
          </div>
          <div class="col-md-6">
            <input type="email" class="form-control" placeholder="Your Email" required />
          </div>
          <div class="col-12">
            <input type="text" class="form-control" placeholder="Subject" required />
          </div>
          <div class="col-12">
            <textarea class="form-control" rows="4" placeholder="Message" required></textarea>
          </div>
          <div class="col-12 text-center">
            <button type="submit" class="btn btn-success">Send Message</button>
          </div>
        </form>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer py-4 bg-dark text-white mt-5">
      <div class="container text-center">
        <p class="mb-1">&copy; <span>{{ new Date().getFullYear() }}</span> <strong class="sitename">DESS</strong> All Rights Reserved</p>
        <div class="mb-2">
          <a href="#" class="text-white me-3"><i class="bi bi-twitter-x"></i></a>
          <a href="#" class="text-white me-3"><i class="bi bi-facebook"></i></a>
          <a href="#" class="text-white me-3"><i class="bi bi-instagram"></i></a>
          <a href="#" class="text-white"><i class="bi bi-linkedin"></i></a>
        </div>
        <small>Designed by <a href="#" class="text-success">@DESS</a></small>
      </div>
    </footer>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import LoginModal from '../components/LoginModal.vue';
import TypeIt from 'typeit';

const features = [
  { icon: 'bi bi-shield-check', title: 'Secure Storage' },
  { icon: 'bi bi-fingerprint', title: 'Access Control' },
  { icon: 'bi bi-folder-symlink', title: 'Case Management' },
  { icon: 'bi bi-key', title: 'Integrity Checks' },
  { icon: 'bi bi-clock-history', title: 'Audit Logs' },
  { icon: 'bi bi-people', title: 'Collaboration' },
  { icon: 'bi bi-database-fill-check', title: 'Data Backup' },
  { icon: 'bi bi-file-earmark-lock', title: 'File Security' },
];
const stats = [
  { icon: 'bi bi-folder-check', value: 500, label: 'Cases Managed' },
  { icon: 'bi bi-file-earmark-check', value: 10000, label: 'Evidence Files' },
  { icon: 'bi bi-people', value: 250, label: 'Active Investigators' },
  { icon: 'bi bi-shield-check', value: 100, label: 'Security Score' },
];
const details = [
  {
    img: '/img/details-1.png',
    title: 'User Authentication & Case Creation',
    items: [
      'Investigators log in using secure credentials and MFA',
      'Create cases with unique identifiers',
      'Add investigators and manage permissions',
    ],
  },
  {
    img: '/img/details-2.png',
    title: 'Evidence Upload & Verification',
    items: [
      'Files are stored with unique hash values for verification',
      'Every action is logged for accountability',
      'Data integrity through advanced cryptographic techniques',
    ],
  },
  {
    img: '/img/details-3.png',
    title: 'Collaboration & Tracking',
    items: [
      'Multiple investigators can work on the same case',
      'Track all activities with comprehensive audit logs',
      'Maintain chain of custody for legal compliance',
    ],
  },
];
const faqs = [
  { q: 'How secure is the evidence storage?', a: 'All evidence is encrypted and access is strictly controlled with audit logs.' },
  { q: 'Can multiple investigators work on a case?', a: 'Yes, the system supports collaboration and role-based permissions.' },
  { q: 'How is data integrity ensured?', a: 'Cryptographic hashes and audit trails ensure all evidence is tamper-proof.' },
];

const showAuth = ref(false);
const typeHeading = ref<HTMLElement | null>(null);
const typeParagraph = ref<HTMLElement | null>(null);

onMounted(() => {
  if (typeHeading.value) {
    new TypeIt(typeHeading.value, {
      speed: 60,
      waitUntilVisible: true,
    })
      .type('Digital Evidence ')
      .pause(300)
      .type('<span class="text-success">Storage System</span>')
      .go();
  }
  if (typeParagraph.value) {
    new TypeIt(typeParagraph.value, {
      speed: 40,
      waitUntilVisible: true,
      startDelay: 1800,
    })
      .type('A secure platform designed to store, manage, and access digital evidence for investigative purposes.')
      .go();
  }
});
function goHome() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

</script>
