const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' }); //THIS IS HERE BECAUSE :*** the environmental variables have to load before the app is rendered

const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
  })
  .then(() => {
    // console.log(con.connections);
    console.log('DB connection successful!'); // RETURN A MESSAGE IF CONNECTION WAS SUCCESSFULL **** Don't forget to delete this when deploying to net
  });

//An instance of the Tour class
// const testTour = new Tour({
//   name: 'The Forest Hiker',
//   rating: 4.7,
//   price: 497
// });

// testTour
//   .save()
//   .then(doc => {
//     console.log(doc);
//   })
//   .catch(err => {
//     console.log('Error ', err);
//   });

/////////////////////////////////////////******************************************************************************************************************/
/**************************************************************************** Server **********************************************************************/
//Do change the default port to 8000 when in production
const port = process.env.PORT || 8000;
const server = app.listen(port, () => {
  console.log(`app running on port ${port}`);
});

process.on('unhandledRejection', err => {
  console.log('UNHANDLED REJECTION.  Shutting Down..');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  console.log('\u{1F44B} SIGTERM RECEIVED. Shutting Down Gracefully');
  server.close(() => {
    console.log('\u{2734} Process Terminated');
  });
});
