import express from 'express'
import bodyParser from "body-parser"
import router from "./routes/router";

const app = express()
const port = process.argv[2]

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.use('/', router)

app.listen(port, () => {
    console.log(`Server is running at ${port} port`);
});
