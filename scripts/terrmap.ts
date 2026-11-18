/**
 * A territory's plan as JSON, for looking at a map without a browser (docs/design/territories.md):
 * npx vite-node scripts/terrmap.ts lowfurrow [day] > plan.json
 */
import { landJob, territoryPlan, type LandId } from '../src/shared/territory';

const [land = 'lowfurrow', day = '3'] = process.argv.slice(2);
process.stdout.write(JSON.stringify(territoryPlan(landJob(land as LandId, Number(day)))));
