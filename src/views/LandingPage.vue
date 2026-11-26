<!-- Removed duplicate template block -->
<template>
  <div>
    <!-- Header -->
    <header id="header" class="header d-flex align-items-center fixed-top">
      <div class="container-fluid container-xl position-relative d-flex align-items-center justify-content-between">
        <a href="#" @click.prevent="scrollToSection('hero')" class="logo d-flex align-items-center" aria-label="DESS home">
          <img src="/img/dess-logo.svg" alt="DESS — Digital Evidence Storage System" class="landing-brand-logo" />
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
            <p class="text-success fw-semibold text-uppercase mb-3" style="letter-spacing: .12em; font-size: .78rem;">A shared workspace for investigative work</p>
            <h1 class="display-4 fw-bold">Digital Evidence <span class="text-success">Storage System</span></h1>
            <p class="lead">Whether the work is part of an academic project, an institutional research programme or an active investigation, DESS helps people organise case information, manage related evidence and work together with clearer context.</p>
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
            <h2 class="fw-bold">A connected workspace for investigative research.</h2>
            <p class="text-muted">Investigative information is often spread across documents, evidence files, case records and different teams. DESS brings these materials and the people working with them into a structured digital workspace. It supports both the management of ongoing casework and the study of completed cases, whether the work takes place in an educational institution, research organisation or operational environment.</p>
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
                  <p class="mb-0 text-muted">Associate files with descriptions, classifications, metadata and recorded integrity information.</p>
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
          <p class="text-muted mx-auto" style="max-width: 680px;">DESS provides two connected workspaces: the DESS Portal for managing operational casework, and the Case Repository for researching completed cases and collaborating around approved information.</p>
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
          <p class="text-success fw-semibold text-uppercase mb-2" style="letter-spacing: .1em; font-size: .75rem;">Who can use DESS</p>
          <h2 class="fw-bold">Supporting investigative work across different environments.</h2>
        </div>
        <div class="row g-4">
          <div class="col-md-4">
            <article class="p-4 border rounded-3 h-100">
              <i class="bi bi-mortarboard fs-2 text-success"></i>
              <h5 class="mt-3">Education &amp; training</h5>
              <p class="text-muted mb-0">Support coursework, practical learning, academic projects and the study of documented investigative cases.</p>
            </article>
          </div>
          <div class="col-md-4">
            <article class="p-4 border rounded-3 h-100">
              <i class="bi bi-search fs-2 text-success"></i>
              <h5 class="mt-3">Research &amp; professional organisations</h5>
              <p class="text-muted mb-0">Organise research activity, examine completed cases, preserve findings and support collaboration across teams.</p>
            </article>
          </div>
          <div class="col-md-4">
            <article class="p-4 border rounded-3 h-100">
              <i class="bi bi-shield-check fs-2 text-success"></i>
              <h5 class="mt-3">Investigative &amp; operational teams</h5>
              <p class="text-muted mb-0">Manage active casework, keep evidence connected to case records and coordinate authorised team members.</p>
            </article>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works -->
    <section id="how-it-works" class="details section py-5 bg-light">
      <div class="container">
        <div class="text-center mb-5">
          <p class="text-success fw-semibold text-uppercase mb-2" style="letter-spacing: .1em; font-size: .75rem;">How DESS works</p>
          <h2 class="fw-bold">One platform. Two purpose-built workspaces.</h2>
          <p class="text-muted mx-auto" style="max-width: 760px;">Choose the workspace that matches what you need to do. Each has its own tools and access rules, while both support structured, responsible investigative work.</p>
        </div>
        <div class="row g-4">
          <div class="col-lg-6">
            <article class="p-4 p-lg-5 border rounded-3 bg-white h-100 shadow-sm">
              <div class="d-flex align-items-center gap-3 mb-3">
                <div class="rounded-3 bg-success bg-opacity-10 p-3"><i class="bi bi-shield-lock fs-2 text-success"></i></div>
                <div>
                  <span class="small text-success fw-semibold text-uppercase">For active casework</span>
                  <h3 class="h4 fw-bold mb-0">DESS Portal</h3>
                </div>
              </div>
              <p class="text-muted">A working environment for authorised personnel and teams responsible for managing cases and their associated evidence.</p>
              <ol class="list-unstyled mb-0">
                <li class="d-flex gap-3 mb-3"><span class="badge rounded-pill text-bg-success align-self-start">01</span><div><strong>Create and organise cases</strong><div class="text-muted small">Register case details, assign team members and keep key information together.</div></div></li>
                <li class="d-flex gap-3 mb-3"><span class="badge rounded-pill text-bg-success align-self-start">02</span><div><strong>Manage evidence and activity</strong><div class="text-muted small">Upload and describe evidence, record case updates and maintain an activity history.</div></div></li>
                <li class="d-flex gap-3"><span class="badge rounded-pill text-bg-success align-self-start">03</span><div><strong>Coordinate the case team</strong><div class="text-muted small">Use case-linked messaging, notifications and controlled access to support team coordination.</div></div></li>
              </ol>
            </article>
          </div>
          <div class="col-lg-6">
            <article class="p-4 p-lg-5 border rounded-3 bg-white h-100 shadow-sm">
              <div class="d-flex align-items-center gap-3 mb-3">
                <div class="rounded-3 bg-success bg-opacity-10 p-3"><i class="bi bi-journal-richtext fs-2 text-success"></i></div>
                <div>
                  <span class="small text-success fw-semibold text-uppercase">For learning and research</span>
                  <h3 class="h4 fw-bold mb-0">Case Repository</h3>
                </div>
              </div>
              <p class="text-muted">A research environment for people studying completed cases, exploring documented information and collaborating on findings.</p>
              <ol class="list-unstyled mb-0">
                <li class="d-flex gap-3 mb-3"><span class="badge rounded-pill text-bg-success align-self-start">01</span><div><strong>Discover completed cases</strong><div class="text-muted small">Search and filter closed case records, explore related cases and review available case context.</div></div></li>
                <li class="d-flex gap-3 mb-3"><span class="badge rounded-pill text-bg-success align-self-start">02</span><div><strong>Build your research workspace</strong><div class="text-muted small">Bookmark cases and approved evidence, write private notes, organise collections and export research summaries.</div></div></li>
                <li class="d-flex gap-3"><span class="badge rounded-pill text-bg-success align-self-start">03</span><div><strong>Discuss and collaborate</strong><div class="text-muted small">Join case discussions, reply to contributions and send collaboration requests to other researchers.</div></div></li>
              </ol>
            </article>
          </div>
        </div>
        <div class="text-center mt-4">
          <p class="small text-muted mb-0"><i class="bi bi-lock-fill text-success me-1"></i>Access to cases and evidence is governed by user roles, case status and the permissions granted by the responsible personnel.</p>
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
              <button
                class="accordion-button"
                :class="{ collapsed: openFaqIndex !== idx }"
                type="button"
                :aria-expanded="openFaqIndex === idx"
                :aria-controls="'collapse' + idx"
                @click="toggleFaq(idx)"
              >
                <i class="bi bi-question-circle me-2 text-success"></i>{{ faq.q }}
              </button>
            </h2>
            <div
              :id="'collapse' + idx"
              class="accordion-collapse collapse"
              :class="{ show: openFaqIndex === idx }"
              :aria-labelledby="'heading' + idx"
            >
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
        <p class="mb-2"><img src="/img/dess-logo.svg" alt="DESS — Digital Evidence Storage System" class="footer-brand-logo" /></p>
        <small class="d-block text-white-50">A connected digital workspace for case management, investigative research and collaboration.</small>
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
  { icon: 'bi bi-fingerprint', title: 'Evidence Metadata & Integrity Records' },
  { icon: 'bi bi-shield-lock', title: 'Role-based Access' },
  { icon: 'bi bi-clock-history', title: 'Activity & Audit Trails' },
  { icon: 'bi bi-chat-square-text', title: 'Case-team Messaging' },
];
const faqs = [
  { q: 'What is DESS?', a: 'DESS is a digital workspace that supports both operational case management and research into completed cases. It provides dedicated DESS Portal and Case Repository workspaces with access based on each user’s role and permissions.' },
  { q: 'Who is DESS designed for?', a: 'DESS can support people involved in investigative work across educational institutions, research groups, organisations and operational teams, including students, researchers, analysts, investigators and other authorised personnel.' },
  { q: 'Can researchers view every case and every file?', a: 'No. Research access is permission-controlled. Researchers can browse closed case records and only the evidence files that have been approved for research access.' },
  { q: 'Can I ask about a related case that is still open?', a: 'When a search identifies a relevant open case, the repository can provide a way to contact the case lead through DESS internal messaging. The open case evidence itself remains restricted.' },
  { q: 'How does DESS support evidence integrity?', a: 'Evidence records include SHA-256 hashes that can be used for file-integrity verification. DESS also maintains time-stamped activity records for supported case actions.' },
  { q: 'Does DESS determine whether evidence is admissible in court?', a: 'No. DESS supports evidence organization, research and collaboration. Legal admissibility and official evidence-handling requirements remain subject to the relevant laws, policies and procedures.' },
];

const showAuth = ref(false);
const openFaqIndex = ref<number | null>(null);

function toggleFaq(index: number) {
  openFaqIndex.value = openFaqIndex.value === index ? null : index;
}

function scrollToSection(id: string) {
  const section = document.getElementById(id);
  if (!section) return;
  const margin = Number.parseInt(getComputedStyle(section).scrollMarginTop || '0', 10) || 0;
  const top = section.getBoundingClientRect().top + window.scrollY - margin;
  window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
}

</script>

<style scoped>
.landing-brand-logo { display: block; width: 205px; max-width: 42vw; height: 54px; object-fit: contain; object-position: left center; }
.footer-brand-logo { display: inline-block; width: 190px; max-width: 70vw; height: 48px; object-fit: contain; }
@media (max-width: 575px) { .landing-brand-logo { width: 165px; height: 45px; } }
</style>
