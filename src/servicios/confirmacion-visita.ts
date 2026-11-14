import * as Haptics from 'expo-haptics';

export async function confirmarVisitaGuardada(): Promise<void> {
  try {
    await Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Success
    );
  } catch {
    // La visita ya está guardada; la vibración es una confirmación adicional.
  }
}
