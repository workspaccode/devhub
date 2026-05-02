import { Router, type IRouter } from "express";
import healthRouter from "./health";
import profileRouter from "./profile";
import platformsRouter from "./platforms";
import githubRouter from "./github";
import gitlabRouter from "./gitlab";
import bitbucketRouter from "./bitbucket";
import slackRouter from "./slack";
import activityRouter from "./activity";
import projectsRouter from "./projects";

const router: IRouter = Router();

router.use(healthRouter);
router.use(profileRouter);
router.use(platformsRouter);
router.use(githubRouter);
router.use(gitlabRouter);
router.use(bitbucketRouter);
router.use(slackRouter);
router.use(activityRouter);
router.use(projectsRouter);

export default router;
