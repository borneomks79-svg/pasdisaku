import { Module } from '@nestjs/common';
import { ImportService } from './import.service';
import { ConnectorRegistry } from '../connectors/connector-registry';
import { CsvFeedConnector } from '../connectors/csv-feed.connector';
import { PricingModule } from '../../pricing/pricing.module';
import { CategoriesModule } from '../../categories/categories.module';

@Module({
  imports: [PricingModule, CategoriesModule],
  providers: [ImportService, ConnectorRegistry, CsvFeedConnector],
  exports: [ImportService],
})
export class ImportEngineModule {}
