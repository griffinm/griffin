import { useState } from "react";
import { 
  Card, 
  CardContent, 
  Typography,
  TextField,
  Button,
  Link as MuiLink,
} from "@mui/material";
import { Link } from "react-router-dom";
import { urls } from "../../utils/urls";
import { useUser } from "../../providers/UserProvider";
import { ErrorDisplay } from "../../components/ErrorDisplay";

export function SignIn() {
  const { signIn, errors } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    signIn(email, password);
  }

  return (
    <div className="flex flex-col justify-center md:justify-start items-center h-screen bg-dark-1">
      <div className="w-full max-w-md md:mt-[200px] p-5">
        <Card sx={{ width: '100%' }}>
          <CardContent>
            <div className="text-center pb-5">
              <Typography variant="h5" component="h2">
                Sign In
              </Typography>
            </div>
            <ErrorDisplay errors={errors} />
            <form onSubmit={handleSubmit}>
              <TextField
                label="Email"
                type="email"
                fullWidth
                margin="normal"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <TextField
                label="Password"
                type="password"
                fullWidth
                margin="normal"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button
                sx={{ mt: 2 }}
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
              >
                Sign In
              </Button>
              <div className="text-center pt-5">
                <Typography variant="body1" component="p">
                  Don't have an account?&nbsp; <MuiLink component={Link} to={urls.signUp}>Sign Up</MuiLink>
                </Typography>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}