import Joi from 'joi';

export const intentionSchema = Joi.object({
    origin_cep: Joi.string().length(8).regex(/^\d+$/).required(),
    destination_cep: Joi.string().length(8).regex(/^\d+$/).required(),
    lead_id: Joi.string().optional(),
});

export const leadSchema = Joi.object({
    name: Joi.string().min(3).required(),
    email: Joi.string().email().required(),
});
