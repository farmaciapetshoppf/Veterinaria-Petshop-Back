import { Injectable } from "@nestjs/common";
import { Pet, PetEspecies, PetSexo, PetTamano, PetEsterilizado, PetStatus } from "../entities/pet.entity";
import { Repository } from "typeorm";

@Injectable()
export class PetRepository extends Repository<Pet> {

    // 🐾 Precarga de datos
    private pets: Pet[] = [
        {
            id: "1",
            nombre: "Luna",
            especie: PetEspecies.GATO,
            sexo: PetSexo.HEMBRA,
            tamano: PetTamano.PEQUENO,
            esterilizado: PetEsterilizado.SI,
            status: PetStatus.VIVO,
            fecha_nacimiento: "2021-05-10",
            fecha_fallecimiento: null,
            breed: "siamés",
            image: null,
            owner: null,
            mother: null,
            father: null,
            childrenAsMother: [],
            childrenAsFather: []
        },
        {
            id: "2",
            nombre: "Rocky",
            especie: PetEspecies.PERRO,
            sexo: PetSexo.MACHO,
            tamano: PetTamano.MEDIANO,
            esterilizado: PetEsterilizado.NO,
            status: PetStatus.VIVO,
            fecha_nacimiento: "2020-03-01",
            fecha_fallecimiento: null,
            breed: "labrador",
            image: null,
            owner: null,
            mother: null,
            father: null,
            childrenAsMother: [],
            childrenAsFather: []
        }
    ];

  }
