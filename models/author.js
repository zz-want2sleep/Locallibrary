const mongoose = require('mongoose')
const Schema = mongoose.Schema
const moment = require('moment')

const AuthorSchema = new Schema({
    first_name: {
        type: String,
        required: true,
        max: 100
    },
    family_name: {
        type: String,
        required: true,
        max: 100
    },
    date_of_birth: {
        type: Date
    },
    date_of_death: {
        type: Date
    }
})

//虚拟属性'name'：表示作者全名
AuthorSchema.virtual('name').get(function () {
    return this.family_name + ' ' + this.first_name;
})
//虚拟属性'url'：作者url
AuthorSchema.virtual('url').get(function () {
    return '/catalog/author/' + this._id
})
//虚拟属性'lifesapn'：作者寿命
AuthorSchema.virtual('lifespan').get(function () {
    return this.date_of_birth && this.date_of_death ? (this.date_of_death.getYear() - this.date_of_birth.getYear()).toString() : '未知'
})
//虚拟属性'date_of_birth_formatted'和'date_of_death_formatted'
AuthorSchema.virtual('date_of_birth_formatted').get(function () {
    return this.date_of_birth ? moment(this.date_of_birth).format('YYYY-MM-DD') : '未知'
})
AuthorSchema.virtual('date_of_death_formatted').get(function () {
    return this.date_of_death ? moment(this.date_of_death).format('YYYY-MM-DD') : (this.date_of_birth ? '至今' : '未知')
})

//导出Author模型
module.exports = mongoose.model('Author', AuthorSchema)