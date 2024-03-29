const Genre = require('../models/genre');
const Book = require('../models/book')
const async = require('async')
const {
    body,
    validationResult
} = require('express-validator/check');
const {
    sanitizeBody
} = require('express-validator/filter');
// 显示完整的藏书种类列表
exports.genre_list = (req, res, next) => {
    Genre.find({}, 'name').sort([
        ['title', 'ascending']
    ]).exec(function (err, genres_list) {
        if (err) {
            return next(err)
        }
        res.render('genre_list', {
            title: '藏书种类列表',
            genres_list: genres_list
        })
    })
};

// 为每一类藏书显示详细信息的页面
exports.genre_detail = (req, res, next) => {
    async.parallel({
        genre: function (callback) {
            Genre.findById(req.params.id).exec(callback)
        },
        books_genre: function (callback) {
            Book.find({
                'genre': req.params.id
            }).exec(callback)
        }
    }, function (err, results) {
        if (err) {
            return next(err)
        }
        if (results === null) {
            var err = new Error('没有找到相应的藏书种类')
            err.status = 404
            return next(err)
        }
        res.render('genre_detail', {
            title: '种类详情页',
            genre: results.genre,
            genre_books: results.books_genre
        })
    })
};

// 由 GET 显示创建藏书种类的表单
exports.genre_create_get = (req, res, next) => {
    res.render('genre_form', {
        title: '创建藏书种类'
    })
};

// 由 POST 处理藏书种类创建操作
exports.genre_create_post = [
    //Validate that the name field is not empty.
    body('name', '种类名称是必填的!').isLength({
        min: 1
    }).trim(),
    //Sanitize(修建名称字段和转义任何危险的HTML字段)trim and escape the name filed
    sanitizeBody('name').trim().escape(),
    // Process request after validation and sanitization.
    (req, res, next) => {
        const errors = validationResult(req);
        // Create a genre object with escaped and trimmed data.
        var genre = new Genre({
            name: req.body.name
        });
        if (!errors.isEmpty()) {
            res.render('genre_form', {
                title: '创建藏书种类',
                genre: genre,
                errors: errors.array()
            })
            return;
        } else {
            //Data from form is valid.
            //Check if Genre with same name already exists.
            Genre.findOne({
                name: req.body.name
            }).exec(function (err, found_genre) {
                if (err) {
                    return next(err);
                }
                if (found_genre) {
                    //Genre exists,redirect to its detail page.
                    res.redirect(found_genre.url)
                } else {
                    genre.save(function (err) {
                        if (err) {
                            return next(err);
                        }
                        //Genre saved. Redirect to genre detail page.
                        res.redirect(genre.url)
                    })
                }
            })
        }
    }
];

// 由 GET 显示删除藏书种类的表单
exports.genre_delete_get = (req, res, next) => {
    async.parallel({
        genre: function (callback) {
            Genre.findById(req.params.id).exec(callback);
        },
        genre_books: function (callback) {
            Book.find({
                'genre': req.params.id
            }).exec(callback);
        },
    }, function (err, results) {
        if (err) {
            return next(err);
        }
        if (results.genre == null) { // No results.
            res.redirect('/catalog/genres');
        }
        // Successful, so render.
        res.render('genre_delete', {
            title: '删除该种类',
            genre: results.genre,
            genre_books: results.genre_books
        });
    });
};

// 由 POST 处理藏书种类删除操作
exports.genre_delete_post = function (req, res, next) {

    async.parallel({
        genre: function (callback) {
            Genre.findById(req.params.id).exec(callback);
        },
        genre_books: function (callback) {
            Book.find({
                'genre': req.params.id
            }).exec(callback);
        },
    }, function (err, results) {
        if (err) {
            return next(err);
        }
        // Success
        if (results.genre_books.length > 0) {
            // Genre has books. Render in same way as for GET route.
            res.render('genre_delete', {
                title: 'Delete Genre',
                genre: results.genre,
                genre_books: results.genre_books
            });
            return;
        } else {
            // Genre has no books. Delete object and redirect to the list of genres.
            Genre.findByIdAndRemove(req.body.id, function deleteGenre(err) {
                if (err) {
                    return next(err);
                }
                // Success - go to genres list.
                res.redirect('/catalog/genres');
            });

        }
    });

};

// 由 GET 显示更新藏书种类的表单
exports.genre_update_get = function (req, res, next) {

    Genre.findById(req.params.id, function (err, genre) {
        if (err) {
            return next(err);
        }
        if (genre == null) { // No results.
            var err = new Error('Genre not found');
            err.status = 404;
            return next(err);
        }
        // Success.
        res.render('genre_form', {
            title: '更新种类',
            genre: genre
        });
    });

};

// Handle Genre update on POST.
exports.genre_update_post = [

    // Validate that the name field is not empty.
    body('name', 'Genre name required').isLength({
        min: 1
    }).trim(),

    // Sanitize (escape) the name field.
    sanitizeBody('name').escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request .
        const errors = validationResult(req);

        // Create a genre object with escaped and trimmed data (and the old id!)
        var genre = new Genre({
            name: req.body.name,
            _id: req.params.id
        });


        if (!errors.isEmpty()) {
            // There are errors. Render the form again with sanitized values and error messages.
            res.render('genre_form', {
                title: '更新种类',
                genre: genre,
                errors: errors.array()
            });
            return;
        } else {
            // Data from form is valid. Update the record.
            Genre.findByIdAndUpdate(req.params.id, genre, {}, function (err, thegenre) {
                if (err) {
                    return next(err);
                }
                // Successful - redirect to genre detail page.
                res.redirect(thegenre.url);
            });
        }
    }
];