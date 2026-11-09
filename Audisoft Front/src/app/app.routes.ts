import { Routes } from '@angular/router';

import { Shell } from './layout/shell';

export const routes: Routes = [
  {
    path: '',
    component: Shell,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'home' },
      {
        path: 'students',
        title: 'Estudiantes · Gestión Académica',
        data: { breadcrumb: 'Estudiantes' },
        loadComponent: () => import('./features/students/students-page').then((m) => m.StudentsPage),
      },
      {
        path: 'home',
        title: 'Inicio · Gestión Académica',
        data: { breadcrumb: 'Inicio' },
        loadComponent: () => import('./features/home/home-page').then((m) => m.HomePage),
      },
      {
        path: 'teachers',
        title: 'Profesores · Gestión Académica',
        data: { breadcrumb: 'Profesores' },
        loadComponent: () => import('./features/teachers/teachers-page').then((m) => m.TeachersPage),
      },
      {
        path: 'subjects',
        title: 'Asignaturas · Gestión Académica',
        data: { breadcrumb: 'Asignaturas' },
        loadComponent: () => import('./features/subjects/subjects-page').then((m) => m.SubjectsPage),
      },
      {
        path: 'grades',
        title: 'Notas · Gestión Académica',
        data: { breadcrumb: 'Notas' },
        loadComponent: () => import('./features/grades/grades-page').then((m) => m.GradesPage),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
