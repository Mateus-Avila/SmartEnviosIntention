import express from 'express'
import { PrismaClient } from '@prisma/client'
import Joi from 'joi';
import nodemailer from 'nodemailer'
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

//Criação da variável prisma, para utilizar as funções da biblioteca prisma
const prisma = new PrismaClient()
const app = express()
app.use(express.json())

// Validações com Joi
const intentionSchema = Joi.object({
    origin_cep: Joi.string().length(8).required(), // CEP deve ter exatamente 8 caracteres
    destination_cep: Joi.string().length(8).required(),
    lead_id: Joi.string().optional(),
});

const leadSchema = Joi.object({
    name: Joi.string().min(3).required(), // Nome deve ter no mínimo 3 caracteres
    email: Joi.string().email().required(), // Email deve ser válido
});

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: 'testemateusprogramacao@gmail.com',
        pass: 'trni pgqm odgi sort',
    },
});

//Método POST da rota /intention, para registrar uma intenção de cálculo de frete
app.post('/intention', async (req, res, next) => {
    const { error } = intentionSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    try {
        const createdIntention = await prisma.intention.create({
            data: {
                origin_cep: req.body.origin_cep,
                destination_cep: req.body.destination_cep,
            },
        });
        res.status(201).json(createdIntention);
    } catch (err) {
        next(err);
    }
});

//Método PUT da rota /intention/:id para editar uma intention especificada pelo seu id e colocar o id do lead
app.put('/intention/:id', async (req, res, next) => {
    const { error } = intentionSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    try {
        const intention = await prisma.intention.findUnique({
            where: { id: req.params.id },
        });
        if (!intention) {
            return res.status(404).json({ error: 'Intention not found' });
        }

        const updatedIntention = await prisma.intention.update({
            where: { id: req.params.id },
            data: {
                origin_cep: req.body.origin_cep,
                destination_cep: req.body.destination_cep,
                lead_id: req.body.lead_id,
            },
        });
        res.status(200).json(updatedIntention);
    } catch (err) {
        next(err);
    }
});

//Método POST da rota /lead para criar um lead
app.post('/lead', async (req, res, next) => {
    const { error } = leadSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    try {
        const createdLead = await prisma.lead.create({
            data: {
                name: req.body.name,
                email: req.body.email,
            },
        });

        // Envio do Email
        await transporter.sendMail({
            from: 'Leads Smart Envios <testemateusprogramacao@gmailcom>',
            to: req.body.email,
            subject: 'Obrigado por se cadastrar!',
            html: `<h1>Olá, ${req.body.name}</h1> <p>Obrigado por se cadastrar em nossa plataforma!</p>`,
            text: `Olá. ${req.body.name}, obrigado por se cadastrar em nossa plataforma!`
    });

        res.status(201).json(createdLead);
    } catch (err) {
        next(err);
    }
});

//Rota /docs com método get para obter a documentação do swagger
app.get('/docs', (req, res) => {

})

// Tratamento de erro caso dê erro no servidor
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000')
})
