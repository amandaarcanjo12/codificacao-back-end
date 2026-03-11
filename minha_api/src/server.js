
const express = require('express')
const cors = require('cors')
require('dotenv').config()
const routes = require('./routes/routes')
const app = express()
app.use(cors())
app.use(express.json())
app.use('minha_api',routes)
const PORT = process.env.PORT || 3000


app.listen(PORT, () => {
    console.log('Servidor rodando na porta ${PORT}')
})

const router = express.Router()
router.get('/',(req,res) => {
    res.json({mensagem: "API funcionando"})
})
router.get('/usuarios',(req,res) => {
    const usuarios = [
        {id: 1, nome: 'Ana'},
        {id: 2, nome: 'Carlos'},
    ]
    res.json(usuarios)
}
    )

module.exports = router
