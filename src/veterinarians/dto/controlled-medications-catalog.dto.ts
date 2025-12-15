// Catálogo de medicamentos controlados disponibles para veterinarios
export interface ControlledMedication {
  id: string;
  nombre: string;
  categoria: string;
  descripcion: string;
  presentacion: string;
  requiereMatricula: boolean;
  restricciones: string;
}

export const CONTROLLED_MEDICATIONS_CATALOG: ControlledMedication[] = [
  // Anestésicos
  {
    id: 'ketamina-100',
    nombre: 'Ketamina 100mg/ml',
    categoria: 'Anestésicos',
    descripcion: 'Anestésico disociativo para procedimientos quirúrgicos',
    presentacion: 'Frasco ampolla 10ml',
    requiereMatricula: true,
    restricciones: 'Lista III - Requiere registro de uso',
  },
  {
    id: 'propofol-10',
    nombre: 'Propofol 1%',
    categoria: 'Anestésicos',
    descripcion: 'Agente anestésico de acción rápida',
    presentacion: 'Ampolla 20ml',
    requiereMatricula: true,
    restricciones: 'Uso exclusivo veterinario',
  },
  {
    id: 'tiopental-500',
    nombre: 'Tiopental Sódico 500mg',
    categoria: 'Anestésicos',
    descripcion: 'Barbitúrico de acción ultracorta',
    presentacion: 'Frasco ampolla 500mg',
    requiereMatricula: true,
    restricciones: 'Lista I - Control estricto',
  },
  
  // Opioides
  {
    id: 'morfina-10',
    nombre: 'Morfina 10mg/ml',
    categoria: 'Analgésicos Opioides',
    descripcion: 'Analgésico opioide para dolor severo',
    presentacion: 'Ampolla 1ml',
    requiereMatricula: true,
    restricciones: 'Lista I - Estupefaciente',
  },
  {
    id: 'tramadol-50',
    nombre: 'Tramadol 50mg',
    categoria: 'Analgésicos Opioides',
    descripcion: 'Analgésico opioide para dolor moderado a severo',
    presentacion: 'Caja 20 comprimidos',
    requiereMatricula: true,
    restricciones: 'Lista IV - Psicotrópico',
  },
  {
    id: 'fentanilo-100',
    nombre: 'Fentanilo 100mcg/ml',
    categoria: 'Analgésicos Opioides',
    descripcion: 'Opioide potente para dolor intenso',
    presentacion: 'Ampolla 2ml',
    requiereMatricula: true,
    restricciones: 'Lista I - Estupefaciente - Alto riesgo',
  },
  {
    id: 'buprenorfina-03',
    nombre: 'Buprenorfina 0.3mg/ml',
    categoria: 'Analgésicos Opioides',
    descripcion: 'Opioide parcial para analgesia prolongada',
    presentacion: 'Ampolla 1ml',
    requiereMatricula: true,
    restricciones: 'Lista III - Control moderado',
  },
  
  // Sedantes y Tranquilizantes
  {
    id: 'diazepam-10',
    nombre: 'Diazepam 10mg',
    categoria: 'Sedantes',
    descripcion: 'Benzodiacepina para sedación y control de convulsiones',
    presentacion: 'Caja 30 comprimidos',
    requiereMatricula: true,
    restricciones: 'Lista IV - Psicotrópico',
  },
  {
    id: 'midazolam-5',
    nombre: 'Midazolam 5mg/ml',
    categoria: 'Sedantes',
    descripcion: 'Sedante de acción rápida',
    presentacion: 'Ampolla 3ml',
    requiereMatricula: true,
    restricciones: 'Lista IV - Psicotrópico',
  },
  {
    id: 'acepromazina-10',
    nombre: 'Acepromazina 10mg/ml',
    categoria: 'Sedantes',
    descripcion: 'Tranquilizante fenotiazínico veterinario',
    presentacion: 'Frasco 50ml',
    requiereMatricula: true,
    restricciones: 'Uso veterinario exclusivo',
  },
  
  // Barbitúricos
  {
    id: 'pentobarbital-60',
    nombre: 'Pentobarbital Sódico 60mg/ml',
    categoria: 'Barbitúricos',
    descripcion: 'Barbitúrico para eutanasia veterinaria',
    presentacion: 'Frasco 100ml',
    requiereMatricula: true,
    restricciones: 'Lista I - Solo eutanasia - Registro obligatorio',
  },
  {
    id: 'fenobarbital-100',
    nombre: 'Fenobarbital 100mg',
    categoria: 'Anticonvulsivantes',
    descripcion: 'Control de epilepsia y convulsiones',
    presentacion: 'Caja 60 comprimidos',
    requiereMatricula: true,
    restricciones: 'Lista IV - Receta archivada',
  },
  
  // Relajantes Musculares
  {
    id: 'succinilcolina-50',
    nombre: 'Succinilcolina 50mg',
    categoria: 'Relajantes Musculares',
    descripcion: 'Bloqueante neuromuscular despolarizante',
    presentacion: 'Ampolla 2ml',
    requiereMatricula: true,
    restricciones: 'Uso anestésico exclusivo',
  },
  {
    id: 'vecuronio-10',
    nombre: 'Vecuronio 10mg',
    categoria: 'Relajantes Musculares',
    descripcion: 'Bloqueante neuromuscular no despolarizante',
    presentacion: 'Frasco ampolla',
    requiereMatricula: true,
    restricciones: 'Uso anestésico exclusivo',
  },
  
  // Otros Controlados
  {
    id: 'xilacina-20',
    nombre: 'Xilacina 2%',
    categoria: 'Sedantes Veterinarios',
    descripcion: 'Sedante, analgésico y relajante muscular',
    presentacion: 'Frasco 50ml',
    requiereMatricula: true,
    restricciones: 'Uso veterinario - No usar en equinos para consumo',
  },
  {
    id: 'detomidina-10',
    nombre: 'Detomidina 10mg/ml',
    categoria: 'Sedantes Veterinarios',
    descripcion: 'Sedante alfa-2 agonista para equinos',
    presentacion: 'Frasco 20ml',
    requiereMatricula: true,
    restricciones: 'Especies mayores - Registro obligatorio',
  },
];
