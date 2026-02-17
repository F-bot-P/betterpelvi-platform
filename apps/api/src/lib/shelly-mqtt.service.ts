// // // import { Injectable, OnModuleInit } from '@nestjs/common';
// // // import * as mqtt from 'mqtt';

// // // @Injectable()
// // // export class ShellyMqttService implements OnModuleInit {
// // //   private client: mqtt.MqttClient;

// // //   onModuleInit() {
// // //     const url = process.env.MQTT_URL;
// // //     const username = process.env.MQTT_USERNAME;
// // //     const password = process.env.MQTT_PASSWORD;

// // //     this.client = mqtt.connect(url!, {
// // //       username,
// // //       password,
// // //       reconnectPeriod: 5000,
// // //     });

// // //     this.client.on('connect', () => {
// // //       console.log('✅ MQTT connected');
// // //     });

// // //     this.client.on('error', (err) => {
// // //       console.error('❌ MQTT error:', err.message);
// // //     });
// // //   }

// // //   async turnOn(deviceId: string) {
// // //     const topic = `shellies/${deviceId}/relay/0/command`;
// // //     this.client.publish(topic, 'on');
// // //   }

// // //   async turnOff(deviceId: string) {
// // //     const topic = `shellies/${deviceId}/relay/0/command`;
// // //     this.client.publish(topic, 'off');
// // //   }
// // // }
// // import { Injectable, OnModuleInit } from '@nestjs/common';
// // import * as mqtt from 'mqtt';

// // @Injectable()
// // export class ShellyMqttService implements OnModuleInit {
// //   private client: mqtt.MqttClient;

// //   onModuleInit() {
// //     this.client = mqtt.connect(process.env.MQTT_URL!, {
// //       username: process.env.MQTT_USERNAME,
// //       password: process.env.MQTT_PASSWORD,
// //       reconnectPeriod: 5000,
// //       clean: true,
// //     });

// //     this.client.on('connect', () => {
// //       console.log('✅ MQTT connected');
// //     });

// //     this.client.on('error', (err) => {
// //       console.error('❌ MQTT error:', err.message);
// //     });
// //   }

// //   private publish(topic: string, payload: string) {
// //     if (!this.client?.connected) {
// //       console.error('MQTT not connected');
// //       return;
// //     }

// //     this.client.publish(topic, payload, { qos: 1 }, (err) => {
// //       if (err) console.error('Publish error:', err.message);
// //     });
// //   }

// //   async turnOn(deviceId: string, relay: number = 0) {
// //     const topic = `shellies/${deviceId}/relay/${relay}/command`;
// //     this.publish(topic, 'on');
// //   }

// //   async turnOff(deviceId: string, relay: number = 0) {
// //     const topic = `shellies/${deviceId}/relay/${relay}/command`;
// //     this.publish(topic, 'off');
// //   }
// // }
// import { Injectable, OnModuleInit } from '@nestjs/common';
// import * as mqtt from 'mqtt';

// @Injectable()
// export class ShellyMqttService implements OnModuleInit {
//   private client: mqtt.MqttClient;

//   onModuleInit() {
//     const url = process.env.MQTT_URL;
//     const username = process.env.MQTT_USERNAME;
//     const password = process.env.MQTT_PASSWORD;

//     this.client = mqtt.connect(url!, {
//       username,
//       password,
//       reconnectPeriod: 5000,
//       clean: true,
//     });

//     this.client.on('connect', () => {
//       console.log('✅ MQTT connected');
//     });

//     this.client.on('error', (err) => {
//       console.error('❌ MQTT error:', err.message);
//     });
//   }

//   async publish(topic: string, payload: string) {
//     this.client.publish(topic, payload, { qos: 1 });
//   }

//   async turnOn(topic: string) {
//     await this.publish(topic, 'on');
//   }

//   async turnOff(topic: string) {
//     await this.publish(topic, 'off');
//   }
// }
import { Injectable, OnModuleInit } from '@nestjs/common';
import * as mqtt from 'mqtt';

@Injectable()
export class ShellyMqttService implements OnModuleInit {
  private client: mqtt.MqttClient;

  onModuleInit() {
    const url = process.env.MQTT_URL;
    const username = process.env.MQTT_USERNAME;
    const password = process.env.MQTT_PASSWORD;

    this.client = mqtt.connect(url!, {
      username,
      password,
      reconnectPeriod: 5000,
    });

    this.client.on('connect', () => {
      console.log('✅ MQTT connected');
    });

    this.client.on('error', (err) => {
      console.error('❌ MQTT error:', err.message);
    });
  }

  private buildTopic(deviceId: string, relay: number = 0) {
    return `shellies/${deviceId}/relay/${relay}/command`;
  }

  async turnOn(deviceId: string, relay: number = 0) {
    const topic = this.buildTopic(deviceId, relay);
    this.client.publish(topic, 'on');
  }

  async turnOff(deviceId: string, relay: number = 0) {
    const topic = this.buildTopic(deviceId, relay);
    this.client.publish(topic, 'off');
  }
}
