import { useState } from "react";
import { useUser } from "../../providers/UserProvider"
import { Button, TextField } from "@mui/material";

export function ProfileForm() {
  const { user } = useUser();
  const [userName, setUserName] = useState(user?.firstName);
  const [email, setEmail] = useState(user?.email);
  const [password, setPassword] = useState('');

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="pb-5">
        <TextField
          label="Username"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          fullWidth
        />
      </div>

      <div className="pb-5">
        <TextField
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
        />
      </div>

      <div className="pb-5">
        <TextField
          type="password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
        />
      </div>

      <div className="text-right">
        <Button variant="contained" color="primary" type="submit">
          Save
        </Button>
      </div>
    </form>
  )
}
