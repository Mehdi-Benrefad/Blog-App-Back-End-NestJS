import { Patch, Query, UploadedFile, UseGuards, UseInterceptors , Request , Res} from '@nestjs/common';
// Controller, Post, Body, Get, Param, Delete, Put, UseGuards, Query, UseInterceptors, UploadedFile, Request, Res 
import { Body, Delete, Get, Param, Post } from '@nestjs/common';
import { Put } from '@nestjs/common';
import { Controller } from '@nestjs/common';
import { Pagination } from 'nestjs-typeorm-paginate';
import { Observable , of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { hasRoles } from 'src/auth/docorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { User, UserRole } from './models/user.interface';
import { UserService } from './user.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path = require('path');
import { join } from 'path';

//variable pour configurer le storage de la fonction d'upload
export const storage = {
    storage: diskStorage({
        destination: './uploads/profileimages',
        filename: (req, file, cb) => {
            const filename: string = path.parse(file.originalname).name.replace(/\s/g, '') + uuidv4();
            const extension: string = path.parse(file.originalname).ext;

            cb(null, `${filename}${extension}`)
        }
    })
}

@Controller('users')
export class UserController {
    constructor(private userService: UserService) { }

    @Post()
    create(@Body() user:User): Observable<User | Object>{
        return this.userService.create(user).pipe(
            map((user: User) => user),
            catchError(err => of({ error: err.message }))
        );
        //return this.userService.create(user);
    }


    
    @Post('login')
    login(@Body() user: User): Observable<Object> {
        return this.userService.login(user).pipe(
            map((jwt: string) => {
                return { access_token: jwt };
            })
        )
    }



    @Get(':id')
    findOne(@Param()params:User): Observable<User>{
        return this.userService.findOne(params.id);
    }


    
    @Get()
    index( @Query('page') page: number = 1, @Query('limit') limit: number = 10,@Query('username') username: string): Observable<Pagination<User>> {
        limit = limit > 100 ? 100 : limit;

        if(username === null || username === undefined) {
            return this.userService.paginate({page: Number(page), limit: Number(limit), route: 'http://localhost:3000/api/users'});
        } else {
            return this.userService.paginateFilterByUsername(
                {page: Number(page), limit: Number(limit), route: 'http://localhost:3000/api/users'},
                {username}
            )
        }
        //return this.userService.paginate({page: Number(page), limit: Number(limit), route: 'http://localhost:3000/users'});
    }
    

 
    /*
    @hasRoles(UserRole.ADMIN)
    @UseGuards(JwtAuthGuard , RolesGuard )
    @Get()
    findAll(): Observable<User[]>{
        return this.userService.findAll();
    }

    */

    @Delete(':id')
    deleteOne(@Param('id') id:string):Observable<any>{
        return this.userService.deleteOne(Number(id));
    }


    @Put(':id')
    updateOne(@Param('id')id:string, @Body() user: User): Observable<any>{
        return this.userService.updateOne(Number(id) , user);
    }



    @hasRoles(UserRole.ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Put(':id/role')
    updateRoleOfUser(@Param('id') id: string, @Body() user: User): Observable<User> {
        return this.userService.updateRoleOfUser(Number(id), user);
    }


    //fonction qui nous permet de recevoir le fichier (Image)
    @UseGuards(JwtAuthGuard)
    @Post('upload')
    @UseInterceptors(FileInterceptor('file', storage))
    uploadFile(@UploadedFile() file, @Request() req): Observable<Object> {
        //on recupere l'utilisateur a partir de la requette.
        const user: User = req.user.user;

        return this.userService.updateOne(user.id, {profileImage: file.filename}).pipe(
            tap((user: User) => console.log(user)),
            map((user:User) => ({profileImage: user.profileImage}))
        )
        //return of({imagepath: file.path})
    }


    //recuperation de l'imagepath [@Res est un decorateur qui va nous permettre d'utiliser les fonctions de Express(response Onject de express)]
    @Get('profile-image/:imagename')
    findProfileImage(@Param('imagename') imagename, @Res() res): Observable<Object> {
        return of(res.sendFile(join(process.cwd(), 'uploads/profileimages/' + imagename)));
    }

}
