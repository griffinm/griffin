import { Typography } from "@mui/material";
import { PageContainer } from "../../components/PageContainer";
import { ProfileForm } from "./ProfileForm";

export function Profile() {
  return (
    <PageContainer>
      <Typography variant="h4">
        Profile
      </Typography>
      <div className="pt-5 w-[400px]">
        <ProfileForm />
      </div>
    </PageContainer>
  );
}
