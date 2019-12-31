import { DynamicModule, Module, Provider, Global } from '@nestjs/common';
import { newEnforcer } from 'casbin';
import { MongoClientOptions } from 'mongodb';
import { MongoAdapter } from 'casbin-mongodb-adapter';
import { NestCasbinService } from './nest-casbin.service';
import { CASBIN_ENFORCER } from './nest-casbin.constants';

@Global()
@Module({
  providers: [NestCasbinService],
  exports: [NestCasbinService],
})
export class NestCasbinModule {
  public static forRootAsync(
    uri: string,
    casbinModelPath: string,
    databaseName: string,
    collectionName: string,
    clientOptions?: MongoClientOptions,
  ): DynamicModule {
    const casbinEnforcerProvider: Provider = {
      provide: CASBIN_ENFORCER,
      useFactory: async () => {
        const adapter = await MongoAdapter.newAdapter({
          uri,
          collectionName: collectionName || 'casbin',
          databaseName: databaseName || 'node-casbin-official',
          option: clientOptions,
        });

        await adapter.open();
        const enforcer = await newEnforcer(casbinModelPath, adapter);
        await enforcer.loadPolicy();
        return enforcer;
      },
    };
    return {
      exports: [casbinEnforcerProvider, NestCasbinService],
      module: NestCasbinModule,
      providers: [casbinEnforcerProvider, NestCasbinService],
    };
  }
}
