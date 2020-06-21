class APIfeatures {
  constructor(query, queryStr) {
    this.query = query;
    this.queryStr = queryStr;
  }

  filter() {
    //Buliding the filtering query object
    //1.) filtering
    const queryObj = { ...this.queryStr };
    //array of values to be excluded from the filtering query
    const excludeFields = ['page', 'sort', 'limit', 'fields'];
    excludeFields.forEach(el => delete queryObj[el]);

    //.2) Advanced filtering

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
    this.query = this.query.find(JSON.parse(queryStr));

    return this;
  }

  sort() {
    //Check if the query contains the sort method
    if (this.queryStr.sort) {
      //setting up a string separated by single spaces that is needed to be read in the sorting method
      const sortQuery = this.queryStr.sort.split(',').join(' ');
      //parse the query in the sorting method
      this.query = this.query.sort(sortQuery);
    } else {
      //DEFAULT:: sort the results by date created starting wth the recent created
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    //Check to see if the query contains the the fields property
    if (this.queryStr.fields) {
      //separate the fields by single space with replacing the ',' with ' ' character
      const fields = this.queryStr.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  paginate() {
    const page = this.queryStr.page * 1 || 1;
    const limit = this.queryStr.limit * 1 || 100;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = APIfeatures;
