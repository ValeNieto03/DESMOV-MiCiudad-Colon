import type { AlmacenTokensPush, PlataformaPush } from '../../src/common/notifications/ports.js';

export class AlmacenTokensMemoria implements AlmacenTokensPush {
  private readonly porToken = new Map<
    string,
    { usuarioId: string; plataforma: PlataformaPush; creadoEn: Date }
  >();

  guardar(
    usuarioId: string,
    tokenExpo: string,
    plataforma: PlataformaPush,
  ): Promise<{ nuevo: boolean }> {
    const nuevo = !this.porToken.has(tokenExpo);
    this.porToken.set(tokenExpo, {
      usuarioId,
      plataforma,
      creadoEn: new Date(),
    });
    return Promise.resolve({ nuevo });
  }

  borrar(tokenExpo: string): Promise<void> {
    this.porToken.delete(tokenExpo);
    return Promise.resolve();
  }

  tokensDe(usuarioIds: string[]): Promise<string[]> {
    return Promise.resolve(
      [...this.porToken]
        .filter(([, v]) => usuarioIds.includes(v.usuarioId))
        .map(([token]) => token),
    );
  }

  listar(
    usuarioId: string,
  ): Promise<Array<{ plataforma: PlataformaPush; creadoEn: Date }>> {
    return Promise.resolve(
      [...this.porToken.values()]
        .filter((dispositivo) => dispositivo.usuarioId === usuarioId)
        .map(({ plataforma, creadoEn }) => ({ plataforma, creadoEn })),
    );
  }

  descartar(tokens: string[]): Promise<void> {
    tokens.forEach((token) => this.porToken.delete(token));
    return Promise.resolve();
  }

  todos(): string[] {
    return [...this.porToken.keys()];
  }
}