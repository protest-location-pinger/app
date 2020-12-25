import config from 'config';
import { ConnectionOptions, connect } from 'mongoose';

const connectDB = async () => {
  try {
    const mongoURI: string =
      'mongodb+srv://user:d01YCo6Ua1rkqt56@cluster0.tyrfy.mongodb.net/master?retryWrites=true&w=majority';

    const options: ConnectionOptions = {
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false,
      useUnifiedTopology: true
    };
    await connect(
      mongoURI,
      options
    );
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error(err.message);
    // Exit process with failure
    process.exit(1);
  }
};

export default connectDB;