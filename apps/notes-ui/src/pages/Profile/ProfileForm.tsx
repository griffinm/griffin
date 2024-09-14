import { useState } from "react";
import { useUser } from "../../providers/UserProvider"
import { Button, TextField } from "@mui/material";
import { updateUser, UpdateUserRequest } from "../../utils/api";
import { useToast } from "../../providers/ToastProvider";
import { ErrorDisplay } from "../../components/ErrorDisplay";

export function ProfileForm() {
  const { user, setUser } = useUser();
  const { showMessage } = useToast();
  const [userName, setUserName] = useState(user?.firstName);
  const [email, setEmail] = useState(user?.email);
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updateUserRequest: UpdateUserRequest = {
      email: email || undefined,
      firstName: userName || undefined,
      password: password || undefined,
    };

    updateUser(updateUserRequest)
      .then(response => {
        setUser(response.data);
        showMessage('Profile updated successfully');
        setPassword('');
        setErrors([]);
      })
      .catch(error => {
        setErrors(error.response.data.message);
      });
  }

  return (
    <div>
      <div className="pb-5">
        <ErrorDisplay errors={errors} />
      </div>
      <form onSubmit={onSubmit}>
        
        <div className="pb-5">
          <TextField
            label="Username"
            value={userName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserName(e.target.value)}
            fullWidth
          />
        </div>

        <div className="pb-5">
          <TextField
            label="Email"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            fullWidth
          />
        </div>

        <div className="pb-5">
          <TextField
            type="password"
            label="Password"
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            fullWidth
          />
        </div>

        <div className="text-right">
          <Button variant="contained" color="primary" type="submit">
            Save
          </Button>
        </div>
      </form>
    </div>
  )
}
