import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GeneralMedication } from '../entities/general-medication.entity';
import { MedicationRestockRequest } from '../entities/medication-restock-request.entity';
import { AdminNotification } from '../entities/admin-notification.entity';
import { MedicationUsageHistory } from '../entities/medication-usage-history.entity';

@Injectable()
export class GeneralMedicationsSeeder {
  constructor(
    @InjectRepository(GeneralMedication)
    private readonly medicationsRepo: Repository<GeneralMedication>,
    @InjectRepository(MedicationRestockRequest)
    private readonly restockRequestRepo: Repository<MedicationRestockRequest>,
    @InjectRepository(AdminNotification)
    private readonly notificationsRepo: Repository<AdminNotification>,
    @InjectRepository(MedicationUsageHistory)
    private readonly usageHistoryRepo: Repository<MedicationUsageHistory>,
  ) {}

  async seed() {
    console.log('💊 Iniciando seeder de medicamentos...');

    const existingCount = await this.medicationsRepo.count();
    
    // Si hay 60 o más medicamentos, asumir que ya está completo
    if (existingCount >= 60) {
      console.log(`⏭️  Ya hay ${existingCount} medicamentos cargados, saltando seeder`);
      return { medications: existingCount, message: 'Medicamentos ya existentes' };
    }
    
    // Si hay menos de 60, borrar los existentes y recargar todos
    if (existingCount > 0 && existingCount < 60) {
      console.log(`⚠️  Solo hay ${existingCount} medicamentos (incompleto). Borrando para recargar...`);
      
      // 1. Borrar historial de uso de medicamentos
      const usageCount = await this.usageHistoryRepo.count();
      if (usageCount > 0) {
        console.log(`   🗑️  Borrando ${usageCount} registros de uso...`);
        await this.usageHistoryRepo.query('DELETE FROM medication_usage_history');
      }
      
      // 2. Borrar notificaciones de admin
      const notificationsCount = await this.notificationsRepo.count();
      if (notificationsCount > 0) {
        console.log(`   🗑️  Borrando ${notificationsCount} notificaciones...`);
        await this.notificationsRepo.query('DELETE FROM admin_notifications');
      }
      
      // 3. Borrar solicitudes de reposición
      const requestCount = await this.restockRequestRepo.count();
      if (requestCount > 0) {
        console.log(`   🗑️  Borrando ${requestCount} solicitudes de reposición...`);
        await this.restockRequestRepo.query('DELETE FROM medication_restock_requests');
      }
      
      // 4. Borrar los medicamentos
      console.log(`   🗑️  Borrando ${existingCount} medicamentos...`);
      await this.medicationsRepo.query('DELETE FROM general_medications');
    }

    const medications = [
      // ANTIBIÓTICOS
      { name: 'Amoxicilina 500mg', category: 'Antibiótico', stock: 150, minStock: 30, unit: 'comprimidos' },
      { name: 'Cefalexina 500mg', category: 'Antibiótico', stock: 120, minStock: 25, unit: 'comprimidos' },
      { name: 'Enrofloxacina 150mg', category: 'Antibiótico', stock: 100, minStock: 20, unit: 'comprimidos' },
      { name: 'Metronidazol 250mg', category: 'Antibiótico', stock: 80, minStock: 20, unit: 'comprimidos' },
      { name: 'Doxiciclina 100mg', category: 'Antibiótico', stock: 90, minStock: 20, unit: 'comprimidos' },

      // ANTIINFLAMATORIOS Y ANALGÉSICOS
      { name: 'Meloxicam 7.5mg', category: 'Antiinflamatorio', stock: 200, minStock: 40, unit: 'comprimidos' },
      { name: 'Carprofeno 75mg', category: 'Antiinflamatorio', stock: 150, minStock: 30, unit: 'comprimidos' },
      { name: 'Prednisona 5mg', category: 'Corticoide', stock: 180, minStock: 35, unit: 'comprimidos' },
      { name: 'Dexametasona 4mg', category: 'Corticoide', stock: 100, minStock: 20, unit: 'comprimidos' },
      { name: 'Ketoprofeno 100mg', category: 'Antiinflamatorio', stock: 75, minStock: 15, unit: 'comprimidos' },

      // ANTIPARASITARIOS
      { name: 'Ivermectina 6mg', category: 'Antiparasitario', stock: 250, minStock: 50, unit: 'comprimidos' },
      { name: 'Albendazol 400mg', category: 'Antiparasitario', stock: 200, minStock: 40, unit: 'comprimidos' },
      { name: 'Fenbendazol 500mg', category: 'Antiparasitario', stock: 150, minStock: 30, unit: 'comprimidos' },
      { name: 'Praziquantel 50mg', category: 'Antiparasitario', stock: 180, minStock: 35, unit: 'comprimidos' },
      { name: 'Milbemicina 2.5mg', category: 'Antiparasitario', stock: 120, minStock: 25, unit: 'comprimidos' },

      // ANTIHISTAMÍNICOS
      { name: 'Cetirizina 10mg', category: 'Antihistamínico', stock: 160, minStock: 30, unit: 'comprimidos' },
      { name: 'Difenhidramina 50mg', category: 'Antihistamínico', stock: 140, minStock: 28, unit: 'comprimidos' },
      { name: 'Hidroxicina 25mg', category: 'Antihistamínico', stock: 100, minStock: 20, unit: 'comprimidos' },

      // GASTROINTESTINALES
      { name: 'Omeprazol 20mg', category: 'Protector gástrico', stock: 200, minStock: 40, unit: 'comprimidos' },
      { name: 'Ranitidina 150mg', category: 'Protector gástrico', stock: 180, minStock: 35, unit: 'comprimidos' },
      { name: 'Metoclopramida 10mg', category: 'Antiemético', stock: 150, minStock: 30, unit: 'comprimidos' },
      { name: 'Loperamida 2mg', category: 'Antidiarreico', stock: 120, minStock: 25, unit: 'comprimidos' },

      // CARDIOLÓGICOS
      { name: 'Enalapril 10mg', category: 'Cardíaco', stock: 100, minStock: 20, unit: 'comprimidos' },
      { name: 'Furosemida 40mg', category: 'Diurético', stock: 150, minStock: 30, unit: 'comprimidos' },
      { name: 'Digoxina 0.25mg', category: 'Cardíaco', stock: 80, minStock: 15, unit: 'comprimidos' },

      // SUPLEMENTOS Y VITAMINAS
      { name: 'Complejo B inyectable', category: 'Vitamina', stock: 50, minStock: 10, unit: 'ampollas' },
      { name: 'Vitamina C 500mg', category: 'Vitamina', stock: 200, minStock: 40, unit: 'comprimidos' },
      { name: 'Glucosamina 500mg', category: 'Condroprotector', stock: 180, minStock: 35, unit: 'comprimidos' },
      { name: 'Condroitina 400mg', category: 'Condroprotector', stock: 160, minStock: 30, unit: 'comprimidos' },
      { name: 'Omega 3 1000mg', category: 'Suplemento', stock: 220, minStock: 45, unit: 'cápsulas' },

      // OFTÁLMICOS Y ÓTICOS
      { name: 'Tobramicina colirio', category: 'Oftálmico', stock: 60, minStock: 12, unit: 'frascos' },
      { name: 'Gentamicina gotas óticas', category: 'Ótico', stock: 70, minStock: 14, unit: 'frascos' },
      { name: 'Lágrimas artificiales', category: 'Oftálmico', stock: 100, minStock: 20, unit: 'frascos' },

      // DERMATOLÓGICOS
      { name: 'Ketoconazol shampoo', category: 'Dermatológico', stock: 80, minStock: 15, unit: 'frascos' },
      { name: 'Pomada antibiótica', category: 'Dermatológico', stock: 90, minStock: 18, unit: 'tubos' },

      // ANTICONVULSIVANTES
      { name: 'Fenobarbital 60mg', category: 'Anticonvulsivante', stock: 100, minStock: 20, unit: 'comprimidos' },
      { name: 'Gabapentina 300mg', category: 'Anticonvulsivante', stock: 80, minStock: 16, unit: 'comprimidos' },

      // HORMONALES
      { name: 'Levotiroxina 100mcg', category: 'Hormonal', stock: 120, minStock: 25, unit: 'comprimidos' },
      { name: 'Insulina NPH', category: 'Hormonal', stock: 40, minStock: 8, unit: 'frascos' },

      // MEDICAMENTOS CONTROLADOS (Stock bajo para indicar necesidad de solicitud)
      // Analgésicos opioides
      { name: 'Tramadol 50mg', category: 'Analgésico controlado', stock: 15, minStock: 30, unit: 'comprimidos' },
      { name: 'Morfina 10mg', category: 'Analgésico controlado', stock: 8, minStock: 20, unit: 'ampollas' },
      { name: 'Fentanilo 100mcg', category: 'Analgésico controlado', stock: 5, minStock: 15, unit: 'ampollas' },
      { name: 'Codeína 30mg', category: 'Analgésico controlado', stock: 12, minStock: 25, unit: 'comprimidos' },
      { name: 'Buprenorfina 0.3mg', category: 'Analgésico controlado', stock: 10, minStock: 20, unit: 'ampollas' },
      { name: 'Hidrocodona 5mg', category: 'Analgésico controlado', stock: 8, minStock: 18, unit: 'comprimidos' },
      
      // Sedantes y ansiolíticos
      { name: 'Diazepam 10mg', category: 'Sedante controlado', stock: 20, minStock: 35, unit: 'comprimidos' },
      { name: 'Midazolam 5mg', category: 'Sedante controlado', stock: 12, minStock: 25, unit: 'ampollas' },
      { name: 'Alprazolam 0.5mg', category: 'Ansiolítico controlado', stock: 15, minStock: 30, unit: 'comprimidos' },
      { name: 'Lorazepam 2mg', category: 'Ansiolítico controlado', stock: 10, minStock: 22, unit: 'comprimidos' },
      { name: 'Clonazepam 2mg', category: 'Anticonvulsivante controlado', stock: 14, minStock: 28, unit: 'comprimidos' },
      
      // Anestésicos
      { name: 'Ketamina 100mg', category: 'Anestésico controlado', stock: 10, minStock: 25, unit: 'frascos' },
      { name: 'Propofol 200mg', category: 'Anestésico controlado', stock: 18, minStock: 30, unit: 'ampollas' },
      { name: 'Tiopental sódico 500mg', category: 'Anestésico controlado', stock: 8, minStock: 18, unit: 'frascos' },
      { name: 'Etomidato 20mg', category: 'Anestésico controlado', stock: 6, minStock: 15, unit: 'ampollas' },
      
      // Estimulantes y otros controlados
      { name: 'Pentobarbital 50mg', category: 'Barbitúrico controlado', stock: 10, minStock: 20, unit: 'ampollas' },
      { name: 'Metadona 10mg', category: 'Analgésico controlado', stock: 7, minStock: 18, unit: 'comprimidos' },
      { name: 'Butorfanol 10mg', category: 'Analgésico controlado', stock: 12, minStock: 24, unit: 'ampollas' },
      { name: 'Acepromazina 10mg', category: 'Tranquilizante controlado', stock: 16, minStock: 32, unit: 'comprimidos' },
      { name: 'Xilazina 100mg', category: 'Sedante controlado', stock: 14, minStock: 28, unit: 'frascos' },
    ];

    const savedMedications: GeneralMedication[] = [];
    for (const med of medications) {
      const newMedication = this.medicationsRepo.create(med);
      const saved = await this.medicationsRepo.save(newMedication);
      savedMedications.push(saved);
    }

    console.log(`✅ ${savedMedications.length} medicamentos cargados exitosamente`);
    
    // Mostrar medicamentos controlados con stock bajo
    const lowStockControlled: GeneralMedication[] = savedMedications.filter(
      (m: GeneralMedication) => m.category.includes('controlado') && m.stock < m.minStock
    );
    
    if (lowStockControlled.length > 0) {
      console.log('⚠️  Medicamentos controlados con stock bajo (requieren solicitud):');
      lowStockControlled.forEach(med => {
        console.log(`   🔴 ${med.name}: Stock ${med.stock} / Mínimo ${med.minStock}`);
      });
    }

    return {
      medications: savedMedications.length,
      lowStockControlled: lowStockControlled.length,
      message: 'Medicamentos cargados exitosamente'
    };
  }
}
