import { args } from "./args.ts";
import { dump } from "./dump.ts";
import { serve } from "./serve.ts";

switch (args.values.mode) {
	case "dump":
		await dump();
		break;
	case "serve":
		serve();
		break;
}
