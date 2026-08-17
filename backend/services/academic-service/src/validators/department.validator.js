const { default: z } = require("zod");


const createSchema = z.object({
    name:z.string().max(140).min(2), 
    code:z.string().min(3).max(20), 
    locations:z.string().min(3).max(50)
})

const updateSchema = createSchema.partial();

const listQuerySchema = z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    search: z.string().max(80).optional(),

});
module.exports = { createSchema, updateSchema, listQuerySchema };