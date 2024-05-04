import { initServer } from "./app"

const init = async () => {
    const app = await initServer();
    app.listen(8000, () => console.log("server started on PORT 8000"))
}

init();
