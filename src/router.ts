import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import HomeView from './views/HomeView.vue'
// Le mode séance est chargé d'emblée : c'est la page ouverte à la salle, souvent en lien direct.
import WorkoutView from './views/WorkoutView.vue'

// Mode hash : aucune 404 sur GitHub Pages, quel que soit le sous-chemin.
const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: HomeView, meta: { title: 'Accueil' } },
  { path: '/seances', name: 'sessions', component: () => import('./views/SessionsView.vue'), meta: { title: 'Séances' } },
  { path: '/seances/:id', name: 'session', component: () => import('./views/SessionDetailView.vue'), props: true, meta: { title: 'Séance' } },
  { path: '/seance/:id/go', name: 'workout', component: WorkoutView, props: true, meta: { title: 'Mode séance', immersive: true } },
  { path: '/exercices', name: 'exercises', component: () => import('./views/ExercisesView.vue'), meta: { title: 'Exercices' } },
  { path: '/exercices/:id', name: 'exercise', component: () => import('./views/ExerciseView.vue'), props: true, meta: { title: 'Fiche exercice' } },
  { path: '/plan', name: 'plan', component: () => import('./views/PlanView.vue'), meta: { title: 'Plan 26 semaines' } },
  { path: '/progression', name: 'progression', component: () => import('./views/ProgressionView.vue'), meta: { title: 'Progression' } },
  { path: '/cardio', name: 'cardio', component: () => import('./views/CardioView.vue'), meta: { title: 'Cardio et pas' } },
  { path: '/alimentation', name: 'nutrition', component: () => import('./views/NutritionView.vue'), meta: { title: 'Alimentation' } },
  { path: '/recuperation', name: 'recovery', component: () => import('./views/RecoveryView.vue'), meta: { title: 'Récupération' } },
  { path: '/suivi', name: 'tracking', component: () => import('./views/TrackingView.vue'), meta: { title: 'Suivi' } },
  { path: '/imprevus', name: 'contingencies', component: () => import('./views/ContingenciesView.vue'), meta: { title: 'Imprévus' } },
  { path: '/parametres', name: 'settings', component: () => import('./views/SettingsView.vue'), meta: { title: 'Paramètres' } },
  { path: '/credits', name: 'credits', component: () => import('./views/CreditsView.vue'), meta: { title: 'Crédits' } },
  { path: '/plus', name: 'more', component: () => import('./views/MoreView.vue'), meta: { title: 'Plus' } },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: (_to, _from, saved) => saved ?? { top: 0 },
})

router.afterEach((to) => {
  const title = to.meta.title as string | undefined
  document.title = title ? `${title} · Muscu 26 semaines` : 'Muscu 26 semaines'
})
