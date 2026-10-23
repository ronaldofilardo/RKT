interface NetworkListenersOptions {
  online: boolean;
  flush: () => void;
  setOnline: (value: boolean) => void;
}

export function attachNetworkListeners({
  online,
  flush,
  setOnline,
}: NetworkListenersOptions): () => void {
  const onNetworkOnline = () => {
    setOnline(true);
    flush();
  };

  const onNetworkOffline = () => {
    setOnline(false);
  };

  window.addEventListener("online", onNetworkOnline);
  window.addEventListener("offline", onNetworkOffline);

  // Tentar flush na inicialização (e periodicamente quando online)
  if (online) {
    flush();
  }

  let intervalId: NodeJS.Timeout;
  if (online) {
    intervalId = setInterval(() => {
      flush();
    }, 30000); // Tentar a cada 30 segundos
  }

  return () => {
    window.removeEventListener("online", onNetworkOnline);
    window.removeEventListener("offline", onNetworkOffline);
    if (intervalId) clearInterval(intervalId);
  };
}
