export class PacketLossTest {
  constructor() {
    this.isRunning = false;
  }

  async run(config = {}) {
    if (this.isRunning) {
      throw new Error('Packet loss test already running');
    }

    this.isRunning = true;

    try {
      const packets = config.packets || 20;
      const timeout = config.timeout || 2000;
      const results = [];

      for (let i = 0; i < packets; i++) {
        if (!this.isRunning) break;

        try {
          await fetch('https://www.google.com/generate_204', {
            method: 'GET',
            mode: 'no-cors',
            signal: AbortSignal.timeout(timeout)
          });
          results.push(true);
        } catch (error) {
          results.push(false);
        }

        // Small delay between packets
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      const lostPackets = results.filter(r => !r).length;
      const percentage = (lostPackets / results.length) * 100;

      return {
        success: true,
        percentage: Math.round(percentage * 100) / 100,
        packetsLost: lostPackets,
        packetsTotal: results.length,
        timestamp: Date.now()
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: Date.now()
      };
    } finally {
      this.isRunning = false;
    }
  }

  stop() {
    this.isRunning = false;
  }
}