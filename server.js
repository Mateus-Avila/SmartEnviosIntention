import express from 'express'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const app = express()
app.use(express.json())

const intentions = []

app.post('/intention', async (req, res) => {
    await prisma.intention.create({
        data: {
            origin_cep: req.body.origin_cep,
            destination_cep: req.body.destination_cep
        }
    })
    res.status(201).json(req.body)
})

app.get('/intention', (req, res) => {
    res.status(200).json(intentions)
})

app.put('/intention/{intention_id}', (req, res) => {

})

app.post('/lead', (req, res) => {

})

app.get('/docs', (req, res) => {

})

/*app.get('/usuarios', (req, res) => {
    res.send('Ok, deu bom')
})
*/

/* 

mateusmenavila
ili1kZiUDIUb9NH8

*/

app.listen(3000)