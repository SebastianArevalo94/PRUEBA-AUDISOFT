import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';

import { ApiError } from '../../core/models/api.models';
import { Student, StudentAverage } from '../../core/models/student.models';
import { StudentsService } from '../../core/services/students.service';
import { Avatar } from '../../shared/ui/avatar';
import { Modal } from '../../shared/ui/modal';
import { GradeTone, gradeTone } from '../../shared/utils/format';

const RING_RADIUS = 52;

// Nombres completos para que Tailwind los detecte al compilar.
const TONE_TEXT: Record<GradeTone, string> = { success: 'text-success', warning: 'text-warning', danger: 'text-danger' };
const TONE_STROKE: Record<GradeTone, string> = { success: 'stroke-success', warning: 'stroke-warning', danger: 'stroke-danger' };

@Component({
  selector: 'app-student-average',
  imports: [Modal, Avatar],
  templateUrl: './student-average.html',
})
export class StudentAverageDialog implements OnInit {
  private readonly service = inject(StudentsService);

  readonly student = input.required<Student>();
  readonly closed = output<void>();
  readonly edit = output<void>();

  protected readonly data = signal<StudentAverage | null>(null);
  protected readonly error = signal<ApiError | null>(null);

  /** Promedios calculados con 2 decimales (como la API) para que el color coincida con el número. */
  protected readonly fmtGrade = (value: number) => value.toFixed(2);
  protected readonly tone = gradeTone;
  protected readonly toneText = TONE_TEXT;
  protected readonly toneStroke = TONE_STROKE;
  protected readonly circumference = 2 * Math.PI * RING_RADIUS;
  protected readonly radius = RING_RADIUS;

  /** Longitud del trazo del anillo (promedio sobre 5.0). */
  protected readonly ringOffset = computed(() => {
    const average = this.data()?.overallAverage ?? 0;
    return this.circumference * (1 - average / 5);
  });

  ngOnInit(): void {
    this.service.average(this.student().id).subscribe({
      next: (data) => this.data.set(data),
      error: (err: ApiError) => this.error.set(err),
    });
  }
}
