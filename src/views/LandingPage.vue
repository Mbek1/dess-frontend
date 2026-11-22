<!-- Removed duplicate template block -->
<template>
  <div>
    <!-- Header -->
    <header id="header" class="header d-flex align-items-center fixed-top">
      <div class="container-fluid container-xl position-relative d-flex align-items-center justify-content-between">
        <a href="#" @click.prevent="scrollToSection('hero')" class="logo d-flex align-items-center">
          <h1 class="sitename">DESS</h1>
        </a>
        <nav id="navmenu" class="navmenu">
          <ul>
            <li><a href="#" data-scroll-target="hero" class="active" @click.prevent="scrollToSection('hero')">Home</a></li>
            <li><a href="#" data-scroll-target="about" @click.prevent="scrollToSection('about')">About DESS</a></li>
            <li><a href="#" data-scroll-target="how-it-works" @click.prevent="scrollToSection('how-it-works')">How It Works</a></li>
            <li><a href="#" data-scroll-target="features" @click.prevent="scrollToSection('features')">Features</a></li>
            <li><a href="#" data-scroll-target="audience" @click.prevent="scrollToSection('audience')">Who It's For</a></li>
            <li><a href="#" data-scroll-target="faq" @click.prevent="scrollToSection('faq')">FAQs</a></li>
          </ul>
          <i class="mobile-nav-toggle d-xl-none bi bi-list"></i>
        </nav>
      </div>
    </header>

    <!-- Hero Section -->
    <section id="hero" class="hero section py-5 bg-dark text-white">
      <div class="container">
        <div class="row align-items-center gy-4">
          <div class="col-lg-7">
            <p class="text-success fw-semibold text-uppercase mb-3" style="letter-spacing: .12em; font-size: .78rem;">Case-based digital forensics research</p>
            <h1 class="display-4 fw-bold">Digital Evidence <span class="text-success">Storage System</span></h1>
            <p class="lead">Bring cases, evidence and documented findings together. DESS is a research and collaboration workspace for cybersecurity and digital-forensics students, researchers and practitioners.</p>
            <div class="d-flex flex-wrap gap-3 mt-4">
              <button class="btn btn-success btn-lg" @click="showAuth = true">Get Started <i class="bi bi-arrow-right ms-1"></i></button>
              <a href="#" @click.prevent="scrollToSection('how-it-works')" class="btn btn-outline-light btn-lg">Explore How It Works</a>
            </div>
            <div class="d-flex flex-wrap gap-3 mt-4 small text-white-50">
              <span><i class="bi bi-folder-check text-success me-1"></i> Case-centred records</span>
              <span><i class="bi bi-fingerprint text-success me-1"></i> Evidence integrity checks</span>
              <span><i class="bi bi-people text-success me-1"></i> Research collaboration</span>
            </div>
          </div>
          <div class="col-lg-5 text-center">
            <img src="/img/hero-img.png" class="img-fluid animated" alt="Digital evidence and case research illustration" style="max-height: 340px;" />
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
            <p class="text-success fw-semibold text-uppercase mb-2" style="letter-spacing: .1em; font-size: .75rem;">About DESS</p>
            <h2 class="fw-bold">A connected view of every case.</h2>
            <p class="text-muted">Digital-forensics knowledge can be scattered across case notes, evidence files and individual teams. DESS brings case records, linked evidence, metadata and case updates into one searchable workspace, helping people learn from previous work and collaborate with the right context.</p>
            <a href="#" @click.prevent="scrollToSection('how-it-works')" class="btn btn-link text-success px-0">See how DESS works <i class="bi bi-arrow-right"></i></a>
          </div>
          <div class="col-xl-7">
            <div class="row g-4">
              <div class="col-md-6">
                <div class="p-4 border rounded-3 h-100">
                  <i class="bi bi-folder2-open fs-2 text-success"></i>
                  <h5 class="mt-3">Case-centred records</h5>
                  <p class="mb-0 text-muted">Keep case identifiers, descriptions, team details, evidence and updates connected in a single case record.</p>
                </div>
              </div>
              <div class="col-md-6">
                <div class="p-4 border rounded-3 h-100">
                  <i class="bi bi-fingerprint fs-2 text-success"></i>
                  <h5 class="mt-3">Evidence with context</h5>
                  <p class="mb-0 text-muted">Associate files with evidence descriptions, classifications and SHA-256 hashes for integrity verification.</p>
                </div>
              </div>
              <div class="col-md-6">
                <div class="p-4 border rounded-3 h-100">
                  <i class="bi bi-journal-text fs-2 text-success"></i>
                  <h5 class="mt-3">Documented case activity</h5>
                  <p class="mb-0 text-muted">Record case updates and review time-stamped activity so that important context does not get lost.</p>
                </div>
              </div>
              <div class="col-md-6">
                <div class="p-4 border rounded-3 h-100">
                  <i class="bi bi-people fs-2 text-success"></i>
                  <h5 class="mt-3">Controlled collaboration</h5>
                  <p class="mb-0 text-muted">Use role-based access, researcher-approved evidence sharing and case-team messaging to collaborate responsibly.</p>
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
        <div class="text-center mb-4">
          <p class="text-success fw-semibold text-uppercase mb-2" style="letter-spacing: .1em; font-size: .75rem;">Platform capabilities</p>
          <h2 class="fw-bold">Everything stays connected to the case.</h2>
          <p class="text-muted mx-auto" style="max-width: 680px;">DESS helps users move from locating a case to understanding its evidence and collaborating around its context.</p>
        </div>
        <div class="row g-4">
          <div class="col-md-3 col-6" v-for="feature in features" :key="feature.title">
            <div class="text-center p-4 border rounded-3 bg-white h-100">
              <i :class="feature.icon + ' fs-1 text-success'"></i>
              <h6 class="mt-3 mb-0">{{ feature.title }}</h6>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Audience Section -->
    <section id="audience" class="py-5 bg-white">
      <div class="container">
        <div class="text-center mb-4">
          <p class="text-success fw-semibold text-uppercase mb-2" style="letter-spacing: .1em; font-size: .75rem;">Who DESS is for</p>
          <h2 class="fw-bold">Built for people who work with digital evidence.</h2>
        </div>
        <div class="row g-4">
          <div class="col-md-4">
            <article class="p-4 border rounded-3 h-100">
              <i class="bi bi-mortarboard fs-2 text-success"></i>
              <h5 class="mt-3">Students</h5>
              <p class="text-muted mb-0">Explore structured case examples, understand how evidence relates to an investigation and strengthen practical digital-forensics learning.</p>
            </article>
          </div>
          <div class="col-md-4">
            <article class="p-4 border rounded-3 h-100">
              <i class="bi bi-search fs-2 text-success"></i>
              <h5 class="mt-3">Researchers</h5>
              <p class="text-muted mb-0">Search archived cases, compare related case records and review evidence that has been approved for research access.</p>
            </article>
          </div>
          <div class="col-md-4">
            <article class="p-4 border rounded-3 h-100">
              <i class="bi bi-shield-check fs-2 text-success"></i>
              <h5 class="mt-3">Practitioners</h5>
              <p class="text-muted mb-0">Organize case evidence, record updates, work with assigned teams and preserve useful investigative context.</p>
            </article>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works -->
    <section id="how-it-works" class="details section py-5 bg-light">
      <div class="container">
        <div class="text-center mb-4">
          <p class="text-success fw-semibold text-uppercase mb-2" style="letter-spacing: .1em; font-size: .75rem;">A simple workflow</p>
          <h2 class="fw-bold">From case discovery to collaboration.</h2>
        </div>
        <div class="row g-4">
          <div class="col-md-4" v-for="(detail, index) in details" :key="detail.title">
            <article class="p-4 border rounded-3 bg-white h-100">
              <div class="d-flex align-items-center justify-content-between mb-3">
                <i :class="detail.icon + ' fs-2 text-success'"></i>
                <span class="text-muted fw-bold">0{{ index + 1 }}</span>
              </div>
              <h5>{{ detail.title }}</h5>
              <ul class="list-unstyled mb-0">
                <li v-for="item in detail.items" :key="item" class="mb-2"><i class="bi bi-check-circle-fill text-success me-2"></i>{{ item }}</li>
              </ul>
            </article>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ Section -->
    <section id="faq" class="faq section py-5 bg-white">
      <div class="container">
        <div class="text-center mb-4">
          <p class="text-success fw-semibold text-uppercase mb-2" style="letter-spacing: .1em; font-size: .75rem;">Good to know</p>
          <h2 class="fw-bold">Frequently asked questions.</h2>
        </div>
        <div class="accordion mx-auto" id="faqAccordion" style="max-width: 900px;">
          <div class="accordion-item" v-for="(faq, idx) in faqs" :key="faq.q">
            <h2 class="accordion-header" :id="'heading' + idx">
              <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" :data-bs-target="'#collapse' + idx" aria-expanded="false" :aria-controls="'collapse' + idx">
                <i class="bi bi-question-circle me-2 text-success"></i>{{ faq.q }}
              </button>
            </h2>
            <div :id="'collapse' + idx" class="accordion-collapse collapse" :aria-labelledby="'heading' + idx" data-bs-parent="#faqAccordion">
              <div class="accordion-body text-muted">{{ faq.a }}</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Access / Call to Action -->
    <section id="access" class="py-5 bg-dark text-white">
      <div class="container text-center">
        <p class="text-success fw-semibold text-uppercase mb-2" style="letter-spacing: .1em; font-size: .75rem;">Start exploring</p>
        <h2 class="fw-bold">Make every case a learning opportunity.</h2>
        <p class="lead text-white-50 mx-auto mt-3" style="max-width: 760px;">Explore documented case records, review researcher-approved evidence and connect with the DESS community through a shared workspace.</p>
        <button class="btn btn-success btn-lg mt-3" @click="showAuth = true">Get Started <i class="bi bi-arrow-right ms-1"></i></button>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer py-4 bg-dark text-white">
      <div class="container text-center">
        <p class="mb-2"><strong class="sitename">DESS</strong> · Digital Evidence Storage System</p>
        <small class="d-block text-white-50">A case-based research and collaboration workspace for cybersecurity and digital forensics.</small>
        <small class="d-block text-white-50 mt-2">&copy; {{ new Date().getFullYear() }} DESS. For research and collaboration; not a replacement for official evidence-handling or court procedures.</small>
      </div>
    </footer>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import LoginModal from '../components/LoginModal.vue';

const features = [
  { icon: 'bi bi-search', title: 'Case Search & Discovery' },
  { icon: 'bi bi-folder-check', title: 'Case-linked Evidence' },
  { icon: 'bi bi-journal-text', title: 'Documented Case Updates' },
  { icon: 'bi bi-diagram-3', title: 'Related-case Discovery' },
  { icon: 'bi bi-fingerprint', title: 'SHA-256 Integrity Checks' },
  { icon: 'bi bi-shield-lock', title: 'Role-based Access' },
  { icon: 'bi bi-clock-history', title: 'Activity & Audit Trails' },
  { icon: 'bi bi-chat-square-text', title: 'Case-team Messaging' },
];
const details = [
  {
    icon: 'bi bi-search',
    title: 'Find a case',
    items: [
      'Search case records using identifiers, descriptions and keywords',
      'Explore relevant archived cases and related case records',
      'Review case classifications and available context',
    ],
  },
  {
    icon: 'bi bi-folder2-open',
    title: 'Review evidence and updates',
    items: [
      'Keep evidence files linked to the case they belong to',
      'Review file descriptions, metadata and SHA-256 hashes',
      'Follow case updates and the recorded activity history',
    ],
  },
  {
    icon: 'bi bi-people',
    title: 'Collaborate with context',
    items: [
      'Share selected evidence with authorized research accounts',
      'Use internal messages and case-team discussion rooms',
      'Contact the case lead when a relevant case is still open',
    ],
  },
];
const faqs = [
  { q: 'What is DESS?', a: 'DESS is a case-based digital evidence research and collaboration platform. It connects case records with related evidence, metadata, case updates and team communication.' },
  { q: 'Who is DESS designed for?', a: 'DESS is intended for cybersecurity and digital-forensics students, researchers and authorized practitioners who need to study, document or collaborate around digital evidence.' },
  { q: 'Can researchers view every case and every file?', a: 'No. Research access is permission-controlled. Researchers can browse closed case records and only the evidence files that have been approved for research access.' },
  { q: 'Can I ask about a related case that is still open?', a: 'When a search identifies a relevant open case, the repository can provide a way to contact the case lead through DESS internal messaging. The open case evidence itself remains restricted.' },
  { q: 'How does DESS support evidence integrity?', a: 'Evidence records include SHA-256 hashes that can be used for file-integrity verification. DESS also maintains time-stamped activity records for supported case actions.' },
  { q: 'Does DESS determine whether evidence is admissible in court?', a: 'No. DESS supports evidence organization, research and collaboration. Legal admissibility and official evidence-handling requirements remain subject to the relevant laws, policies and procedures.' },
];

const showAuth = ref(false);

function scrollToSection(id: string) {
  const section = document.getElementById(id);
  if (!section) return;
  const margin = Number.parseInt(getComputedStyle(section).scrollMarginTop || '0', 10) || 0;
  const top = section.getBoundingClientRect().top + window.scrollY - margin;
  window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
}

</script>
