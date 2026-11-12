
import '../config/load-env.js';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { traducirErrorDeConexion } from '../common/db/providers.js';
import { Sembrador } from './seed.js';

async function ejecutar(): Promise<void> {
    const app = await NestFactory.createApplicationContext(
        AppModule.registrar({
            DB_SINCRONIZAR: 'false',
            SEMBRAR_SI_VACIA: 'false',
        }),
        { logger: ['error', 'warn', 'log'] },
    );

    try {
        await app.get(Sembrador).sembrarSoloEventos();
    } finally {
        await app.close();
    }
}

ejecutar().catch((error: unknown) => {
    const explicacion = traducirErrorDeConexion(error);

    console.error(
        'No se pudieron cargar los eventos:',
        explicacion ?? (error instanceof Error ? error.message : error),
    );

    process.exitCode = 1;
});
